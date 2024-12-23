const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
  const invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));

  const invoicesListDiv = document.getElementById("invoices-list");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  invoicesData.forEach((invoice, index) => {
    const invoiceDiv = document.createElement("div");
    invoiceDiv.className = "invoice-item";
    invoiceDiv.innerHTML = `
      <h5><a href="invoiceTemplate.html?invoiceId=${index}">Račun ${
      index + 1
    }</a></h5>
      <p>Ime kupca: ${invoice.customerName}</p>
      <p>Datum: ${formatDate(invoice.date)}</p>
      <p>Iznos: ${invoice.discountedAmount} €</p>
      <hr />
    `;
    invoicesListDiv.appendChild(invoiceDiv);
  });

  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "hello.html";
  });
});
