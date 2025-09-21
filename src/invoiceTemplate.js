const { jsPDF } = require("jspdf");

// Feedback function to replace alerts
function showFeedback(message, isError = false) {
  const feedbackEl =
    document.getElementById("feedback-container") ||
    (() => {
      const el = document.createElement("div");
      el.id = "feedback-container";
      el.className = "alert";
      document.body.insertBefore(el, document.body.firstChild);
      return el;
    })();

  feedbackEl.textContent = message;
  feedbackEl.className = `alert ${isError ? "alert-danger" : "alert-success"}`;
  feedbackEl.style.display = "block";

  if (!isError) {
    setTimeout(() => {
      feedbackEl.style.display = "none";
    }, 3000);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get("invoiceId");

    if (!invoiceId) {
      showFeedback("ID računa nije pronađen u URL-u", true);
      return;
    }

    // Loading indicator
    const loadingEl = document.createElement("div");
    loadingEl.className = "alert alert-info";
    loadingEl.textContent = "Učitavanje računa...";
    document.body.insertBefore(loadingEl, document.body.firstChild);

    // Get data through secure API
    const [invoices, company, fontData] = await Promise.all([
      window.electronAPI.getData("invoices"),
      window.electronAPI.getData("companyData"),
      window.electronAPI.getFontData("calibri"),
    ]);

    // Hide loading indicator
    loadingEl.style.display = "none";

    // Check if invoice exists
    if (!invoices[invoiceId]) {
      showFeedback("Račun nije pronađen", true);
      return;
    }

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
    document.getElementById("invoice-number").textContent = invoice.number;

    document.querySelectorAll(".invoice-date").forEach((el) => {
      el.textContent = new Date(invoice.date).toLocaleDateString("hr-HR");
    });

    const itemsContainer = document.getElementById("invoice-items");
    itemsContainer.innerHTML = ""; // Clear any existing items

    invoice.services.forEach((item, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>kom</td>
        <td class="text-right">1</td>
        <td class="text-right">${item.price} €</td>
        <td class="text-right">${item.price} €</td>
      `;
      itemsContainer.appendChild(row);
    });

    // Handle discount display
    if (invoice.discount > 0) {
      document.getElementById("discount-container").style.display = "block";
      document.getElementById("discount").textContent = `${invoice.discount}%`;
    } else {
      document.getElementById("discount-container").style.display = "none";
    }

    document.getElementById(
      "total-without-tax"
    ).textContent = `${invoice.totalAmount} €`;
    document.getElementById(
      "total-amount"
    ).textContent = `${invoice.discountedAmount} €`;

    // Export PDF
    document
      .getElementById("export-pdf-button")
      .addEventListener("click", async () => {
        try {
          // Show loading message
          showFeedback("Generiranje PDF-a...");

          // Ask user where to save the PDF
          const result = await window.electronAPI.showSaveDialog({
            title: "Spremi PDF",
            defaultPath: `racun-${invoice.number.replace(/\//g, "-")}.pdf`,
            filters: [{ name: "PDF datoteke", extensions: ["pdf"] }],
          });

          if (result.canceled) {
            return;
          }

          const filePath = result.filePath;

          // Create PDF
          const pdf = new jsPDF({ unit: "mm", format: "a4" });

          // Add font
          if (fontData) {
            pdf.addFileToVFS("calibri.ttf", fontData);
            pdf.addFont("calibri.ttf", "Calibri", "normal", "Identity-H");
            pdf.setFont("Calibri");
          }

          // Get invoice content and prepare for PDF
          const invoiceContent = document.getElementById("invoice-content");
          invoiceContent.style.transform = "scale(0.85)";
          invoiceContent.style.transformOrigin = "top left";
          invoiceContent.style.margin = "0 auto";

          // Generate PDF
          await pdf.html(invoiceContent, {
            callback: async (doc) => {
              const pdfData = doc.output("arraybuffer");

              // Save PDF via secure API
              const saveResult = await window.electronAPI.savePdf(
                filePath,
                Array.from(new Uint8Array(pdfData))
              );

              if (saveResult.success) {
                showFeedback(`PDF uspješno spremljen: ${filePath}`);
              } else {
                throw new Error(saveResult.error);
              }
            },
            x: 10,
            y: 10,
            width: 200,
            windowWidth: invoiceContent.scrollWidth,
          });
        } catch (error) {
          console.error("Error generating PDF:", error);
          showFeedback(`Greška pri generiranju PDF-a: ${error.message}`, true);
        }
      });

    // Navigate back
    document.getElementById("back-button").addEventListener("click", () => {
      window.location.href = "../viewInvoices.html";
    });
  } catch (error) {
    console.error("Error loading invoice template:", error);
    showFeedback(
      `Greška pri učitavanju predloška računa: ${error.message}`,
      true
    );
  }
});
