const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const { jsPDF } = require("jspdf");

// Load custom font
const fontPath = path.join(__dirname, "fonts", "calibri.ttf");
const fontData = fs.readFileSync(fontPath, "base64");

window.addEventListener("DOMContentLoaded", () => {
  const invoicesPath = path.join(__dirname, "data", "invoices.json");
  const companyPath = path.join(__dirname, "data", "companyData.json");

  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get("invoiceId");

  const invoices = JSON.parse(fs.readFileSync(invoicesPath));
  const company = JSON.parse(fs.readFileSync(companyPath));
  const invoice = invoices[invoiceId];

  // Populate data
  document.getElementById("company-info").innerHTML = `
    <p>${company.naziv}, ${company.opis},</p>
    <p>vl. ${company.vlasnik}, ${company.grad}, ${company.adresa}</p>
    <p>OIB: ${company.oib}</p>
    <p>IBAN: ${company.iban}</p>
  `;
  document.getElementById("vlasnik").textContent =
    company.vlasnik.toUpperCase();
  document.getElementById("customer-name").textContent = invoice.customerName;

  document.querySelectorAll(".invoice-date").forEach((el) => {
    el.textContent = new Date(invoice.date).toLocaleDateString("hr-HR");
  });

  const itemsContainer = document.getElementById("invoice-items");
  invoice.services.forEach((item, i) => {
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>kom</td>
        <td class="text-right">1</td>
        <td class="text-right">${item.price} €</td>
        <td class="text-right">${item.price} €</td>
      </tr>
    `;
    itemsContainer.insertAdjacentHTML("beforeend", row);
  });

  if (invoice.discount > 0) {
    document.getElementById("discount-container").style.display = "block";
    document.getElementById("discount").textContent = `${invoice.discount}%`;
  } else {
    document.getElementById("discount-container").style.display = "none";
  }

  document.getElementById(
    "total-without-tax"
  ).textContent = `${invoice.totalAmount} €`;
  document.getElementById("discount").textContent = invoice.discount
    ? `${invoice.discount}%`
    : "N/A";
  document.getElementById(
    "total-amount"
  ).textContent = `${invoice.discountedAmount} €`;

  // Export PDF
  document
    .getElementById("export-pdf-button")
    .addEventListener("click", async () => {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      pdf.addFileToVFS("calibri.ttf", fontData);
      pdf.addFont("calibri.ttf", "Calibri", "normal", "Identity-H");
      pdf.setFont("Calibri");

      try {
        // Ask user where to save the PDF
        const { filePath, canceled } = await ipcRenderer.invoke(
          "show-save-dialog",
          {
            title: "Save PDF",
            defaultPath: `invoice-${invoice.number}.pdf`,
            filters: [{ name: "PDF Files", extensions: ["pdf"] }],
          }
        );

        if (canceled) {
          console.log("User canceled the save dialog.");
          return;
        }

        if (filePath) {
          // Apply scaling to fit content within A4 size
          const invoiceContent = document.getElementById("invoice-content");
          invoiceContent.style.transform = "scale(0.85)";
          invoiceContent.style.transformOrigin = "top left";
          invoiceContent.style.margin = "0 auto";

          // Use the html method to convert HTML content to PDF
          await pdf.html(invoiceContent, {
            callback: (doc) => {
              const pdfData = doc.output("arraybuffer");
              fs.writeFileSync(filePath, Buffer.from(pdfData));
              alert(`PDF saved successfully at ${filePath}`);
            },
            x: 10, // Margin on left
            y: 10, // Margin on top
            width: 200, // Set the width to fit the content within A4 size
            windowWidth: invoiceContent.scrollWidth, // Use the full width of the content
          });
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to save PDF. Please check console for more details.");
      }
    });

  // Navigate back
  document.getElementById("back-button").addEventListener("click", () => {
    console.log("Back button clicked");
    window.location.href = "hello.html";
  });
});
