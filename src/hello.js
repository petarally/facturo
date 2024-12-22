const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const companyDataPath = path.join(__dirname, "data", "companyData.json");
  const companyData = JSON.parse(fs.readFileSync(companyDataPath));

  const companyDataDiv = document.getElementById("company-data");
  companyDataDiv.innerHTML = `
        <p>${companyData.naziv}, ${companyData.opis},</p>
        <p>vl. ${companyData.vlasnik}, ${companyData.grad}, ${companyData.adresa}</p>
        <p>OIB: ${companyData.oib}</p>
        <p>IBAN: ${companyData.iban}</p>
    `;

  document
    .getElementById("add-service-button")
    .addEventListener("click", () => {
      window.location = "addService.html";
    });

  document
    .getElementById("view-services-button")
    .addEventListener("click", () => {
      window.location = "viewServices.html";
    });

  document
    .getElementById("create-invoice-button")
    .addEventListener("click", () => {
      window.location = "createInvoice.html";
    });

  document
    .getElementById("view-invoices-button")
    .addEventListener("click", () => {
      window.location = "viewInvoices.html";
    });

  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });
});
