// Helper function to format dates consistently
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Helper for showing feedback messages
function showFeedback(message, isError = false, duration = 3000) {
  const feedbackEl = document.getElementById("feedback-container");
  if (!feedbackEl) return;

  feedbackEl.textContent = message;
  feedbackEl.className = `alert ${isError ? "alert-danger" : "alert-success"}`;
  feedbackEl.style.display = "block";

  if (!isError && duration > 0) {
    setTimeout(() => {
      feedbackEl.style.display = "none";
    }, duration);
  }
}

// Function to update statistics based on filtered invoices
function updateStatistics(filteredInvoices) {
  // Get references to statistics elements
  const totalInvoicesEl = document.getElementById("total-invoices");
  const totalRevenueEl = document.getElementById("total-revenue");
  const averageAmountEl = document.getElementById("average-amount");

  // Calculate statistics
  const totalInvoices = filteredInvoices.length;

  // Calculate total revenue (sum of all invoice amounts)
  const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.discountedAmount || 0);
  }, 0);

  // Calculate average amount (if there are invoices)
  const averageAmount = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Update the UI with formatted values
  totalInvoicesEl.textContent = totalInvoices;
  totalRevenueEl.textContent = `${totalRevenue.toFixed(2)} €`;
  averageAmountEl.textContent = `${averageAmount.toFixed(2)} €`;
}

window.addEventListener("DOMContentLoaded", async () => {
  const invoicesListDiv = document.getElementById("invoices-list");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "alert alert-info";
  loadingIndicator.textContent = "Učitavanje podataka...";
  invoicesListDiv.appendChild(loadingIndicator);

  let invoicesData, companyData;

  try {
    // Get data through secure API instead of direct file access
    [invoicesData, companyData] = await Promise.all([
      window.electronAPI.getData("invoices"),
      window.electronAPI.getData("companyData"),
    ]);

    // Remove loading indicator
    loadingIndicator.remove();

    const renderInvoices = (filteredInvoices) => {
      invoicesListDiv.innerHTML =
        filteredInvoices.length === 0
          ? "<div class='alert alert-info'>Nema računa za odabrani period</div>"
          : "";

      filteredInvoices.forEach((invoice, index) => {
        const invoiceDiv = document.createElement("div");
        invoiceDiv.className = "invoice-item card mb-3";
        invoiceDiv.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">
              <a href="template/invoiceTemplate.html?invoiceId=${index}">Račun ${
          invoice.number
        }</a>
            </h5>
            <p class="card-text">Ime kupca: ${invoice.customerName}</p>
            <p class="card-text">Datum: ${formatDate(invoice.date)}</p>
            <p class="card-text">Iznos: ${invoice.discountedAmount} €</p>
            <button class="btn btn-sm btn-outline-primary view-invoice" data-index="${index}">
              Prikaži račun
            </button>
          </div>
        `;
        invoicesListDiv.appendChild(invoiceDiv);

        // Add click handler for view button
        invoiceDiv
          .querySelector(".view-invoice")
          .addEventListener("click", () => {
            window.location.href = `template/invoiceTemplate.html?invoiceId=${index}`;
          });
      });

      // Update statistics after rendering invoices
      updateStatistics(filteredInvoices);
    };

    const filterInvoices = (month, year) => {
      const filteredInvoices = invoicesData.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return (
          (month === "all" || invoiceDate.getMonth() + 1 === parseInt(month)) &&
          invoiceDate.getFullYear() === parseInt(year)
        );
      });
      renderInvoices(filteredInvoices);
    };

    // Populate year select
    const yearSelect = document.getElementById("year-select");
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      if (year === currentYear) option.selected = true;
      yearSelect.appendChild(option);
    }

    // Add filter form handler
    document
      .getElementById("filter-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const month = document.getElementById("month-select").value;
        const year = document.getElementById("year-select").value;
        filterInvoices(month, year);
      });

    // Add search functionality
    document
      .getElementById("search-input")
      .addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const month = document.getElementById("month-select").value;
        const year = document.getElementById("year-select").value;

        if (!searchTerm) {
          // If search is cleared, just use the month/year filter
          filterInvoices(month, year);
          return;
        }

        // Filter by both search term and month/year
        const filteredInvoices = invoicesData.filter((invoice) => {
          const invoiceDate = new Date(invoice.date);
          const matchesDate =
            (month === "all" ||
              invoiceDate.getMonth() + 1 === parseInt(month)) &&
            invoiceDate.getFullYear() === parseInt(year);

          const matchesSearch =
            invoice.number.toLowerCase().includes(searchTerm) ||
            invoice.customerName.toLowerCase().includes(searchTerm);

          return matchesDate && matchesSearch;
        });

        renderInvoices(filteredInvoices);
      });

    // Export to Excel handler
    document
      .getElementById("export-csv")
      .addEventListener("click", async function () {
        try {
          showFeedback("Priprema izvoza...");
          const selectedMonth = document.getElementById("month-select").value;
          const selectedYear = document.getElementById("year-select").value;

          // Get template Excel file through IPC
          const excelTemplate = await window.electronAPI.getExcelTemplate();

          if (!excelTemplate) {
            throw new Error("Predložak za izvoz nije pronađen");
          }

          // Generate Excel from template
          const downloadUrl = await generateExcelReport(
            excelTemplate,
            companyData,
            invoicesData,
            selectedMonth,
            selectedYear
          );

          // Trigger download
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `knjiga-prometa-${selectedMonth}-${selectedYear}.xlsx`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);

          showFeedback("Izvoz uspješno završen!");
        } catch (error) {
          console.error("Error exporting data:", error);
          showFeedback("Greška prilikom izvoza: " + error.message, true);
        }
      });

    // Back button handler
    document.getElementById("back-button").addEventListener("click", () => {
      window.location.href = "hello.html";
    });

    // Initial render - current month and year
    const currentDate = new Date();
    document.getElementById("month-select").value = (
      currentDate.getMonth() + 1
    ).toString();
    filterInvoices(currentDate.getMonth() + 1, currentDate.getFullYear());
  } catch (error) {
    console.error("Error loading data:", error);
    loadingIndicator.remove();
    showFeedback("Greška pri učitavanju podataka: " + error.message, true);
  }
});

// Generate Excel report from template and data
async function generateExcelReport(
  templateBuffer,
  companyData,
  invoicesData,
  selectedMonth,
  selectedYear
) {
  // Create workbook from template buffer
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const worksheet = workbook.getWorksheet(1);

  // Fill company data
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

  // Set title with month/year
  const monthNames = [
    "Siječanj",
    "Veljača",
    "Ožujak",
    "Travanj",
    "Svibanj",
    "Lipanj",
    "Srpanj",
    "Kolovoz",
    "Rujan",
    "Listopad",
    "Studeni",
    "Prosinac",
  ];

  // Set report period (if month is "all", show whole year)
  const periodText =
    selectedMonth === "all"
      ? `KNJIGA PROMETA ZA ${selectedYear}.`
      : `KNJIGA PROMETA ZA ${
          monthNames[parseInt(selectedMonth) - 1]
        } ${selectedYear}.`;

  worksheet.getCell("A1").value = periodText;

  // Filter and sort invoices
  const filteredInvoices = invoicesData.filter((invoice) => {
    const invoiceDate = new Date(invoice.date);
    return (
      (selectedMonth === "all" ||
        invoiceDate.getMonth() + 1 === parseInt(selectedMonth)) &&
      invoiceDate.getFullYear() === parseInt(selectedYear)
    );
  });

  // Sort by date
  filteredInvoices.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Clear existing data rows (assuming data starts at row 13)
  for (let i = 13; i < worksheet.rowCount; i++) {
    worksheet.spliceRows(13, 1);
  }

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

  // Add total row
  const totalRowIndex = 13 + filteredInvoices.length;
  const totalRow = worksheet.insertRow(totalRowIndex, [
    "ZBROJ",
    null,
    null,
    null,
    null,
    sum,
    sum,
  ]);

  // Format total row
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Create a Blob from the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  return url;
}
