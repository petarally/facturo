const { ipcRenderer } = require("electron");
const { dialog } = require("@electron/remote");

window.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const invoiceForm = document.getElementById("invoice-form");
  const invoiceServiceSelect = document.getElementById("invoice-service");
  const invoiceServicesList = document.getElementById("invoice-services");
  const invoiceDiscountInput = document.getElementById("invoice-discount");
  const invoiceAmountInput = document.getElementById("invoice-amount");
  const invoiceNumberInput = document.getElementById("invoice-number");
  const lastInvoiceNumberSpan = document.getElementById("last-invoice-number");
  const feedbackEl = document.createElement("div");

  // Setup feedback element
  feedbackEl.className = "alert mt-3";
  feedbackEl.style.display = "none";
  invoiceForm.appendChild(feedbackEl);

  // State
  let selectedServices = [];

  // Initialize data
  try {
    // Get services data
    const servicesData = await ipcRenderer.invoke("get-data", "services");

    if (servicesData.length === 0) {
      showFeedback(
        "Nema dostupnih usluga. Dodajte usluge prije kreiranja računa.",
        true
      );
    } else {
      servicesData.forEach((service) => {
        const option = document.createElement("option");
        option.value = JSON.stringify(service);
        option.textContent = `${service.name} - ${service.price} €`;
        invoiceServiceSelect.appendChild(option);
      });
    }

    // Get invoices data for last invoice number
    const invoicesData = await ipcRenderer.invoke("get-data", "invoices");
    const lastInvoiceNumber =
      invoicesData.length > 0
        ? invoicesData[invoicesData.length - 1].number
        : "0/0/0";

    lastInvoiceNumberSpan.textContent = `Posljednji broj računa: ${lastInvoiceNumber}`;

    // Set default date to today
    document.getElementById("invoice-date").valueAsDate = new Date();
  } catch (error) {
    console.error("Error initializing invoice form:", error);
    showFeedback("Greška prilikom učitavanja podataka", true);
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
      const saveDialog = await dialog.showSaveDialog({
        title: "Spremi račun",
        defaultPath: `racun-${invoiceNumber.replace(/\//g, "-")}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (!saveDialog.canceled) {
        const pdfPath = saveDialog.filePath;
        // TODO: Implement PDF generation
        // For now, notify user
        showFeedback("PDF generiranje će biti implementirano uskoro", false);
      }

      // Save invoice data through IPC
      const invoicesData = await ipcRenderer.invoke("get-data", "invoices");
      invoicesData.push(invoice);

      const result = await ipcRenderer.invoke("save-data", {
        type: "invoices",
        data: invoicesData,
      });

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

  // Back button
  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });

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
