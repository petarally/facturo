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
          showFeedback("Generiranje PDF-a...");
          const result = await window.electronAPI.showSaveDialog({
            title: "Spremi PDF",
            defaultPath: `racun-${invoice.number.replace(/\//g, "-")}.pdf`,
            filters: [{ name: "PDF datoteke", extensions: ["pdf"] }],
          });
          if (result.canceled) return;
          const filePath = result.filePath;
          const invoiceContent = document.getElementById("invoice-content");
          // Use html2pdf.js for pixel-perfect PDF
          const opt = {
            margin: 0,
            filename: filePath,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          };
          html2pdf()
            .set(opt)
            .from(invoiceContent)
            .toPdf()
            .outputPdf("arraybuffer")
            .then(async (pdfData) => {
              const saveResult = await window.electronAPI.savePdf(
                filePath,
                Array.from(new Uint8Array(pdfData))
              );
              if (saveResult.success) {
                showFeedback(`PDF uspješno spremljen: ${filePath}`);
              } else {
                throw new Error(saveResult.error);
              }
            })
            .catch((error) => {
              console.error("Error generating PDF:", error);
              showFeedback(
                "Greška pri generiranju PDF-a: " + error.message,
                true
              );
            });
        } catch (error) {
          console.error("Error generating PDF:", error);
          showFeedback("Greška pri generiranju PDF-a: " + error.message, true);
        }
      });

    // Navigate back
    document.getElementById("back-button").addEventListener("click", () => {
      // Print button handler
      const printBtn = document.getElementById("print-button");
      if (printBtn) {
        printBtn.addEventListener("click", () => {
          window.print();
        });
      }
      window.location.href = "../viewInvoices.html";
    });
  } catch (error) {
    console.error("Error loading invoice template:", error);
    showFeedback(
      "Greška pri učitavanju predloška računa: " + error.message,
      true
    );
  }
});

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "inject-invoice") {
    const invoice = event.data.invoice;
    // Get company data
    window.electronAPI.getData("companyData").then((company) => {
      // Populate data
      document.getElementById("company-info").innerHTML = `
        <p>${company.naziv}, ${company.opis},</p>
        <p>vl. ${company.vlasnik}, ${company.grad}, ${company.adresa}</p>
        <p>OIB: ${company.oib}</p>
        <p>IBAN: ${company.iban}</p>
      `;
      document.getElementById("vlasnik").textContent =
        company.vlasnik.toUpperCase();
      document.getElementById("customer-name").textContent =
        invoice.customerName;
      document.getElementById("invoice-number").textContent = invoice.number;
      document.querySelectorAll(".invoice-date").forEach((el) => {
        el.textContent = new Date(invoice.date).toLocaleDateString("hr-HR");
      });
      const itemsContainer = document.getElementById("invoice-items");
      itemsContainer.innerHTML = "";
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
      if (invoice.discount > 0) {
        document.getElementById("discount-container").style.display = "block";
        document.getElementById(
          "discount"
        ).textContent = `${invoice.discount}%`;
      } else {
        document.getElementById("discount-container").style.display = "none";
      }
      document.getElementById(
        "total-without-tax"
      ).textContent = `${invoice.totalAmount} €`;
      document.getElementById(
        "total-amount"
      ).textContent = `${invoice.discountedAmount} €`;
    });
  }
});
