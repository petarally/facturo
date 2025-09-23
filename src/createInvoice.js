window.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const invoiceForm = document.getElementById("invoice-form");
  const invoiceServiceSelect = document.getElementById("invoice-service");
  const invoiceServicesList = document.getElementById("invoice-services");
  const invoiceDiscountInput = document.getElementById("invoice-discount");
  const invoiceAmountInput = document.getElementById("invoice-amount");
  const invoiceNumberInput = document.getElementById("invoice-number");
  const lastInvoiceNumberSpan = document.getElementById("last-invoice-number");

  // Check if required elements exist
  if (!invoiceForm || !invoiceServiceSelect || !invoiceServicesList) {
    console.error("Required form elements not found");
    return;
  }

  const feedbackEl = document.createElement("div");

  // Setup feedback element
  feedbackEl.className = "alert mt-3";
  feedbackEl.style.display = "none";
  invoiceForm.appendChild(feedbackEl);

  // State
  let selectedServices = [];

  // Initialize data with better loading state
  try {
    // Show loading state
    invoiceServiceSelect.innerHTML =
      "<option disabled selected>Učitavanje usluga...</option>";

    // Get services data
    const servicesData = await window.electronAPI.getData("services");

    // Clear loading option
    invoiceServiceSelect.innerHTML =
      '<option value="" disabled selected>Odaberite uslugu</option>';

    if (servicesData.length === 0) {
      showFeedback(
        "Nema dostupnih usluga. Dodajte usluge prije kreiranja računa.",
        true
      );
      invoiceServiceSelect.innerHTML =
        "<option disabled>Nema dostupnih usluga</option>";
    } else {
      servicesData.forEach((service) => {
        const option = document.createElement("option");
        option.value = JSON.stringify(service);
        option.textContent = `${service.name} - ${service.price.toFixed(2)} €`;
        invoiceServiceSelect.appendChild(option);
      });
    }

    // Get invoices data for last invoice number
    const invoicesData = await window.electronAPI.getData("invoices");
    const lastInvoiceNumber =
      invoicesData.length > 0
        ? invoicesData[invoicesData.length - 1].number
        : "0/0/0";

    lastInvoiceNumberSpan.textContent = `Posljednji broj računa: ${lastInvoiceNumber}`;

    // Set default date to today
    const today = new Date();
    document.getElementById("invoice-date").value = today
      .toISOString()
      .split("T")[0];
  } catch (error) {
    console.error("Error initializing invoice form:", error);
    showFeedback("Greška prilikom učitavanja podataka", true);
    invoiceServiceSelect.innerHTML =
      "<option disabled>Greška pri učitavanju</option>";
  }

  // Add service to invoice
  document
    .getElementById("add-service-button")
    .addEventListener("click", () => {
      if (!invoiceServiceSelect.value) {
        showFeedback("Odaberite uslugu", true);
        return;
      }

      try {
        const selectedService = JSON.parse(invoiceServiceSelect.value);
        selectedServices.push(selectedService);

        const listItem = document.createElement("li");
        listItem.textContent = `${selectedService.name}: ${selectedService.price} €`;
        listItem.classList.add(
          "list-group-item",
          "d-flex",
          "justify-content-between",
          "align-items-center"
        );

        // Add remove button
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.className = "btn btn-sm btn-danger";
        removeBtn.addEventListener("click", () => {
          selectedServices = selectedServices.filter(
            (s) => s !== selectedService
          );
          listItem.remove();
          updateTotalAmount();
        });

        listItem.appendChild(removeBtn);
        invoiceServicesList.appendChild(listItem);

        updateTotalAmount();
        showFeedback("Usluga dodana", false);
      } catch (error) {
        console.error("Error adding service:", error);
        showFeedback("Greška prilikom dodavanja usluge", true);
      }
    });

  // Update total on discount change
  invoiceDiscountInput.addEventListener("input", updateTotalAmount);

  // Form submission
  invoiceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      // Validate form
      const customerName = document
        .getElementById("customer-name")
        .value.trim();
      const invoiceNumber = invoiceNumberInput.value.trim();
      const invoiceDate = document.getElementById("invoice-date").value;

      if (!customerName) {
        showFeedback("Unesite ime kupca", true);
        return;
      }

      if (!invoiceNumber) {
        showFeedback("Unesite broj računa", true);
        return;
      }

      if (selectedServices.length === 0) {
        showFeedback("Dodajte barem jednu uslugu", true);
        return;
      }

      // Calculate totals
      const invoiceDiscount = parseFloat(invoiceDiscountInput.value) || 0;
      const totalAmount = selectedServices.reduce(
        (total, service) => total + parseFloat(service.price),
        0
      );
      const discountedAmount = totalAmount * (1 - invoiceDiscount / 100);

      // Create invoice object
      const invoice = {
        customerName,
        number: invoiceNumber,
        date: invoiceDate,
        services: selectedServices,
        discount: invoiceDiscount,
        totalAmount: totalAmount.toFixed(2),
        discountedAmount: discountedAmount.toFixed(2),
      };

      // Save dialog for PDF
      const saveDialog = await window.electronAPI.showSaveDialog({
        title: "Spremi račun kao PDF",
        defaultPath: `racun-${invoiceNumber.replace(/\//g, "-")}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (!saveDialog.canceled && saveDialog.filePath) {
        const pdfPath = saveDialog.filePath;
        showFeedback("Generiranje PDF-a...", false);

        // Open the invoice template in a new window, inject invoice data, and export to PDF
        const invoiceWindow = window.open(
          `../template/invoiceTemplate.html`,
          "_blank",
          "width=800,height=1000,menubar=no,toolbar=no,location=no,status=no"
        );
        invoiceWindow.onload = async () => {
          // Inject invoice data using postMessage
          invoiceWindow.postMessage({ type: "inject-invoice", invoice }, "*");
          setTimeout(() => {
            const invoiceContent =
              invoiceWindow.document.getElementById("invoice-content");
            const opt = {
              margin: 0,
              filename: pdfPath,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };
            html2pdf()
              .set(opt)
              .from(invoiceContent)
              .toPdf()
              .save(pdfPath)
              .then(() => {
                showFeedback("PDF uspješno kreiran!", false);
                invoiceWindow.close();
              })
              .catch((error) => {
                showFeedback(
                  `Greška pri generiranju PDF-a: ${error.message}`,
                  true
                );
                invoiceWindow.close();
              });
          }, 1000); // Wait for DOM/data injection
        };
      }

      // Save invoice data through IPC
      const invoicesData = await window.electronAPI.getData("invoices");

      // Check for duplicate invoice numbers
      const duplicateInvoice = invoicesData.find(
        (inv) => inv.number === invoiceNumber
      );
      if (duplicateInvoice) {
        showFeedback("Račun s tim brojem već postoji!", true);
        return;
      }

      invoicesData.push(invoice);

      const result = await window.electronAPI.saveData(
        "invoices",
        invoicesData
      );

      if (result.success) {
        showFeedback("Račun uspješno kreiran!");
        resetForm();
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      showFeedback(`Greška prilikom kreiranja računa: ${error.message}`, true);
    }
  });

  // Back button with safety check
  const backButton = document.getElementById("back-button");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "hello.html";
    });
  }

  // Helper functions
  function updateTotalAmount() {
    let totalAmount = selectedServices.reduce(
      (total, service) => total + parseFloat(service.price),
      0
    );
    const discount = parseFloat(invoiceDiscountInput.value) || 0;
    let discountedAmount = totalAmount;

    if (discount > 0) {
      discountedAmount = totalAmount * (1 - discount / 100);
    }

    invoiceAmountInput.value = discountedAmount.toFixed(2);
  }

  function showFeedback(message, isError = false) {
    feedbackEl.textContent = message;
    feedbackEl.className = `alert ${
      isError ? "alert-danger" : "alert-success"
    } mt-3`;
    feedbackEl.style.display = "block";

    if (!isError) {
      setTimeout(() => {
        feedbackEl.style.display = "none";
      }, 3000);
    }
  }

  function resetForm() {
    invoiceForm.reset();
    selectedServices = [];
    invoiceServicesList.innerHTML = "";
    document.getElementById("invoice-date").valueAsDate = new Date();
    updateTotalAmount();
  }
});
