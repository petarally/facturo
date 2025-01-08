const fs = require("fs").promises;
const path = require("path");
const ExcelJS = require("exceljs");

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

window.addEventListener("DOMContentLoaded", async () => {
  const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
  const companyDataPath = path.join(__dirname, "data", "companyData.json");

  let invoicesData, companyData;

  try {
    [invoicesData, companyData] = await Promise.all([
      fs.readFile(invoicesDataPath, "utf-8").then(JSON.parse),
      fs.readFile(companyDataPath, "utf-8").then(JSON.parse),
    ]);

    const invoicesListDiv = document.getElementById("invoices-list");

    const renderInvoices = (filteredInvoices) => {
      invoicesListDiv.innerHTML = "";
      filteredInvoices.forEach((invoice, index) => {
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
    };

    const filterInvoices = (month, year) => {
      const filteredInvoices = invoicesData.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return (
          invoiceDate.getMonth() + 1 === parseInt(month) &&
          invoiceDate.getFullYear() === parseInt(year)
        );
      });
      renderInvoices(filteredInvoices);
    };

    document
      .getElementById("filter-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const month = document.getElementById("month-select").value;
        const year = document.getElementById("year-select").value;
        filterInvoices(month, year);
      });

    document
      .getElementById("export-csv")
      .addEventListener("click", async function () {
        console.log("Export CSV clicked");
        const selectedMonth = document.getElementById("month-select").value;
        const selectedYear = document.getElementById("year-select").value;

        const downloadUrl = await readExcelFile(
          path.join(__dirname, "data", "knjiga-prometa.xlsx"),
          companyData,
          invoicesData, // Pass invoicesData as an argument
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

    // Initial render
    filterInvoices(new Date().getMonth() + 1, new Date().getFullYear());
  } catch (error) {
    console.error("Error loading data:", error);
  }
});

async function readExcelFile(
  filePath,
  companyData,
  invoicesData, // Add invoicesData as a parameter
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
  worksheet.getCell("E6").value = `${companyData.adresa}, ${companyData.grad}`;
  worksheet.getCell("F6").value = `${companyData.adresa}, ${companyData.grad}`;
  worksheet.getCell("G6").value = `${companyData.adresa}, ${companyData.grad}`;
  worksheet.getCell("E7").value = companyData.oib;
  worksheet.getCell("F7").value = companyData.oib;
  worksheet.getCell("G7").value = companyData.oib;
  worksheet.getCell("C9").value = companyData.opis;
  worksheet.getCell("D9").value = companyData.opis;
  worksheet.getCell("E9").value = companyData.opis;
  worksheet.getCell("F9").value = companyData.opis;
  worksheet.getCell("G9").value = companyData.opis;

  // Filter and sort invoices
  const filteredInvoices = invoicesData.filter((invoice) => {
    const invoiceDate = new Date(invoice.date);
    return (
      invoiceDate.getMonth() + 1 === parseInt(selectedMonth) &&
      invoiceDate.getFullYear() === parseInt(selectedYear)
    );
  });

  // Sort by date
  filteredInvoices.sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log("Filtered and sorted invoices:", filteredInvoices);

  // Write filtered and sorted invoices to the worksheet
  let sum = 0;
  filteredInvoices.forEach((invoice, index) => {
    const rowIndex = 13 + index; // Start from row 13
    const row = worksheet.insertRow(rowIndex, [
      index + 1,
      formatDate(invoice.date),
      invoice.number,
      null,
      null,
      parseFloat(invoice.discountedAmount),
      parseFloat(invoice.discountedAmount),
    ]);
    sum += parseFloat(invoice.discountedAmount);

    // Add borders to the cells
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Find the last row with "ZBROJ" and update its values
  const totalRow = worksheet.findRow(worksheet.rowCount);
  if (totalRow) {
    totalRow.getCell(1).value = "ZBROJ";
    totalRow.getCell(6).value = sum;
    totalRow.getCell(7).value = sum;
    totalRow.font = { bold: true };

    // Add borders to the total row cells
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  // Create a Blob from the workbook and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  return url;
}
