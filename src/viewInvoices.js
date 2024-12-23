const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
  const invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));

  const companyDataPath = path.join(__dirname, "data", "companyData.json");
  const companyData = JSON.parse(fs.readFileSync(companyDataPath));

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

  // CSV export - KNJIGA PROMETA
  document.getElementById("export-csv").addEventListener("click", function () {
    const selectedMonth = document.getElementById("month-select").value;
    const selectedYear = document.getElementById("year-select").value;

    // Create CSV content
    let csvContent = "\ufeff";
    csvContent += `;;;;;;
;;;;;;
Obrazac KPR;;;;;;
KNJIGA PROMETA ${selectedYear}.;;;;;;
I. OPĆI PODACI O POREZNO, OBVEZNIKU;;;;;;
1. NAZIV DJELATNOSTI;;;${companyData.opis};;${companyData.kod_djelatnosti};ŠIFRA DJELATNOSTI
2. IME I PREZIME PODUZETNIKA / NOSITELJA ZAJEDNIČKE DJELATNOSTI;;;;${companyData.vlasnik};;
3. ADRESA PREBIVALIŠTA / UOBIČAJENOG BORAVIŠTA;;;;${companyData.adresa}, ${companyData.grad};;
4. OIB PODUZETNIKA / NOSITELJA ZAJEDNIČKE DJELATNOSTI;;;;${companyData.oib};;
II.PODACI O POSLOVNOJ JEDINICI;;;;;;
1. NAZIV DJELATNOSTI;;${companyData.opis};;;;
2. ADRESA;;${companyData.adresa}, ${companyData.grad};;;;
RED.  BR.;NADNEVAK;BROJ                                       TEMELJNICE;OPIS ISPRAVA O PRIMICIMA                        U GOTOVINI;IZNOS NAPLAĆEN                             U GOTOVINI/ČEKOVIMA;IZNOS NAPLAĆEN                   BEZGOTOVINSKIM PUTEM(1);UKUPNO NAPLAĆEN IZNOS
1;2;3;4;5;6;7 (5+6)\n`;

    const filteredInvoices = invoicesData.filter((invoice) => {
      const invoiceDate = new Date(invoice.date);
      return (
        invoiceDate.getMonth() + 1 === parseInt(selectedMonth) &&
        invoiceDate.getFullYear() === parseInt(selectedYear)
      );
    });

    // Sort by date
    filteredInvoices.sort((a, b) => new Date(a.date) - new Date(b.date));
    let sum = 0;
    filteredInvoices.forEach((invoice, index) => {
      csvContent += `${index + 1};${formatDate(invoice.date)};"${
        invoice.number
      }";;;${parseFloat(invoice.discountedAmount)};${parseFloat(
        invoice.discountedAmount
      )}\n`;
      sum += parseFloat(invoice.discountedAmount);
    });
    csvContent += `ZBROJ;;;;0,00;${sum};${sum}\n`;

    csvContent += ` 
;;;;;;
1 Popunjava porezni obveznik koji porez na dohodak od samostalne djelatnosti plaća u paušalnom iznosu u skladu s Pravilnikom o paušalnom oporezivanju samostalnih djelatnosti;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
;;;;;;
`;

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fileName = `knjiga-prometa-${selectedMonth}-${selectedYear}.csv`;

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "hello.html";
  });
});
