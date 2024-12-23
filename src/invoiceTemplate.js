const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get("invoiceId");

  const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
  const invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));
  const invoiceData = invoicesData[invoiceId];

  const companyDataPath = path.join(__dirname, "data", "companyData.json");
  const companyData = JSON.parse(fs.readFileSync(companyDataPath));

  // Populate company data
  const companyInfoDiv = document.getElementById("company-info");
  companyInfoDiv.innerHTML = `
    <p>${companyData.naziv}, ${companyData.opis},</p>
    <p>vl. ${companyData.vlasnik}, ${companyData.grad}, ${companyData.adresa}</p>
    <p>OIB: ${companyData.oib}</p>
    <p>IBAN: ${companyData.iban}</p>
  `;

  // Populate vlasnik data
  document.getElementById(
    "vlasnik"
  ).textContent = `${companyData.vlasnik.toUpperCase()}`;
  document.getElementById(
    "invoice-number"
  ).textContent = `${invoiceData.number}`;

  // Format date to dd.mm.yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Populate invoice with data
  document.getElementById("customer-name").textContent =
    invoiceData.customerName;
  const formattedDate = formatDate(invoiceData.date);
  document.querySelectorAll(".invoice-date").forEach((element) => {
    element.textContent = formattedDate;
  });

  const itemsContainer = document.getElementById("invoice-items");
  invoiceData.services.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>kom</td>
      <td class="text-right">1</td>
      <td class="text-right">${item.price} €</td>
      <td class="text-right">${item.price} €</td>
    `;
    itemsContainer.appendChild(row);
  });

  document.getElementById("total-amount").textContent = new Intl.NumberFormat(
    "hr-HR",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(invoiceData.discountedAmount);

  document.getElementById("total-without-tax").textContent =
    new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(invoiceData.totalAmount);

  // Conditionally display discount
  if (invoiceData.discount > 0) {
    document.getElementById(
      "discount"
    ).textContent = `${invoiceData.discount}%`;
  } else {
    document.getElementById("discount").parentElement.style.display = "none";
  }

  // Export to PDF
  document
    .getElementById("export-pdf-button")
    .addEventListener("click", async () => {
      const invoiceContent =
        document.getElementById("invoice-content").outerHTML;
      const styles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        #company-info p {
          margin: 0;
          padding: 0;
        }
        .invoice-container {
          max-width: 800px;
          margin: 80px auto;
          padding: 80px;
        }
        .header {
          background: #ccc;
          padding: 10px;
          font-size: 18px;
          font-weight: bold;
        }
        .customer-info {
          margin-top: 20px;
          text-align: right;
        }
        .dates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 20px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .table th,
        .table td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .table th {
          background: #f4f4f4;
        }
        .text-right {
          text-align: right;
        }
        .total {
          margin-top: 10px;
          text-align: right;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
        }

        .footer p,
        .footer .dates-grid div {
          margin: 0;
          padding: 0;
        }
        .btn {
          display: inline-block;
          font-weight: 400;
          text-align: center;
          white-space: nowrap;
          vertical-align: middle;
          user-select: none;
          border: 1px solid transparent;
          padding: 0.375rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: 0.25rem;
          transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .btn-primary {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }
        .btn-primary:hover {
          color: #fff;
          background-color: #0056b3;
          border-color: #004085;
        }
        .btn-secondary {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }
        .btn-secondary:hover {
          color: #fff;
          background-color: #5a6268;
          border-color: #545b62;
        }
      </style>
    `;

      const fullContent = `
      <html>
        <head>
          ${styles}
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `;
      try {
        const pdfPath = await ipcRenderer.invoke("generate-pdf", {
          htmlContent: fullContent,
          invoiceNumber: invoiceData.number,
          customerName: invoiceData.customerName,
        });
        alert(`PDF saved to: ${pdfPath}`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF.");
      }
    });

  // Back button
  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "viewInvoices.html";
  });
});
