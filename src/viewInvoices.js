const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
  const invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));

  const invoicesListDiv = document.getElementById("invoices-list");
  invoicesData.forEach((invoice, index) => {
    const invoiceDiv = document.createElement("div");
    invoiceDiv.className = "invoice-item";
    invoiceDiv.innerHTML = `
      <h5><a href="invoiceTemplate.html?invoiceId=${index}">Račun #${
      index + 1
    }</a></h5>
      <p>Ime kupca: ${invoice.customerName}</p>
      <p>Datum: ${invoice.date}</p>
      <p>Iznos: ${invoice.amount}</p>
      <hr />
    `;
    invoicesListDiv.appendChild(invoiceDiv);
  });

  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });
});
