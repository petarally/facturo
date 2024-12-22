const fs = require("fs");
const path = require("path");

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
  document.getElementById("vlasnik").textContent = `${companyData.vlasnik}`;
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
  document.getElementById("invoice-date").textContent = formatDate(
    invoiceData.date
  );
  document.getElementById("delivery-date").textContent = formatDate(
    invoiceData.date
  ); // Assuming delivery date is the same as invoice date
  document.getElementById("due-date").textContent = formatDate(
    invoiceData.date
  ); // Assuming due date is the same as invoice date

  const itemsContainer = document.getElementById("invoice-items");
  invoiceData.services.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>kom</td>
      <td>1</td>
      <td>${item.price} €</td>
      <td>${item.price} €</td>
    `;
    itemsContainer.appendChild(row);
  });

  document.getElementById("total-amount").textContent =
    invoiceData.amount.toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
    });
});
