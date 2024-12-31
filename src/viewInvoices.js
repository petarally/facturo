const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

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

  async function readExcelFile(
    filePath,
    companyData,
    selectedMonth,
    selectedYear
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    // opis u knjizi prometa
    worksheet.getCell("D4").value = companyData.opis;
    worksheet.getCell("E4").value = companyData.opis;
    worksheet.getCell("F4").value = companyData.kod_djelatnosti;
    worksheet.getCell("E5").value = companyData.vlasnik;
    worksheet.getCell("F5").value = companyData.vlasnik;
    worksheet.getCell("G5").value = companyData.vlasnik;
    worksheet.getCell(
      "E6"
    ).value = `${companyData.adresa}, ${companyData.grad}`;
    worksheet.getCell(
      "F6"
    ).value = `${companyData.adresa}, ${companyData.grad}`;
    worksheet.getCell(
      "G6"
    ).value = `${companyData.adresa}, ${companyData.grad}`;
    worksheet.getCell("E7").value = companyData.oib;
    worksheet.getCell("F7").value = companyData.oib;
    worksheet.getCell("G7").value = companyData.oib;
    worksheet.getCell("C9").value = companyData.opis;
    worksheet.getCell("D9").value = companyData.opis;
    worksheet.getCell("E9").value = companyData.opis;
    worksheet.getCell("F9").value = companyData.opis;
    worksheet.getCell("G9").value = companyData.opis;

    // Filter and sort invoices
    const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
    const invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row
        const invoice = {
          date: row.getCell(1).value,
          number: row.getCell(2).value,
          discountedAmount: row.getCell(3).value,
        };
        invoicesData.push(invoice);
      }
    });

    const filteredInvoices = invoicesData.filter((invoice) => {
      const invoiceDate = new Date(invoice.date);
      return (
        invoiceDate.getMonth() + 1 === parseInt(selectedMonth) &&
        invoiceDate.getFullYear() === parseInt(selectedYear)
      );
    });

    // Sort by date
    filteredInvoices.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Write filtered and sorted invoices to the worksheet
    let sum = 0;
    filteredInvoices.forEach((invoice, index) => {
      const row = worksheet.getRow(13); // Start from row 13
      row.getCell(1).value = index + 1;
      row.getCell(2).value = formatDate(invoice.date);
      row.getCell(3).value = invoice.number;
      row.getCell(6).value = parseFloat(invoice.discountedAmount);
      row.getCell(7).value = parseFloat(invoice.discountedAmount);
      sum += parseFloat(invoice.discountedAmount);
      row.commit();
    });

    const totalRow = worksheet.getRow(filteredInvoices.length + 13);
    totalRow.getCell(1).value = "ZBROJ";
    totalRow.getCell(6).value = sum;
    totalRow.getCell(7).value = sum;
    totalRow.commit();

    // Create a Blob from the workbook and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    return url;
  }

  document
    .getElementById("export-csv")
    .addEventListener("click", async function () {
      console.log("Export CSV clicked");
      const selectedMonth = document.getElementById("month-select").value;
      const selectedYear = document.getElementById("year-select").value;
      const companyDataPath = path.join(__dirname, "data", "companyData.json");
      const companyData = JSON.parse(fs.readFileSync(companyDataPath));

      const downloadUrl = await readExcelFile(
        path.join(__dirname, "data", "knjiga-prometa.xlsx"),
        companyData,
        selectedMonth,
        selectedYear
      );

      // Trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "knjiga-prometa-new.xlsx";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    });

  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "hello.html";
  });
});
