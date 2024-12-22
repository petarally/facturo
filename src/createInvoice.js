const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const servicesDataPath = path.join(__dirname, "data", "services.json");
  const invoiceForm = document.getElementById("invoice-form");
  const invoiceServiceSelect = document.getElementById("invoice-service");
  const invoiceServicesList = document.getElementById("invoice-services");
  const invoiceDiscountInput = document.getElementById("invoice-discount");
  const invoiceAmountInput = document.getElementById("invoice-amount");
  let selectedServices = [];

  if (fs.existsSync(servicesDataPath)) {
    const servicesData = JSON.parse(fs.readFileSync(servicesDataPath));
    servicesData.forEach((service) => {
      const option = document.createElement("option");
      option.value = JSON.stringify(service);
      option.textContent = `${service.name} - ${service.price} kn`;
      invoiceServiceSelect.appendChild(option);
    });
  }

  document
    .getElementById("add-service-button")
    .addEventListener("click", () => {
      const selectedService = JSON.parse(invoiceServiceSelect.value);
      selectedServices.push(selectedService);

      const listItem = document.createElement("li");
      listItem.textContent = `${selectedService.name}: ${selectedService.price} kn`;
      listItem.classList.add("list-group-item");
      invoiceServicesList.appendChild(listItem);

      updateTotalAmount();
    });

  invoiceDiscountInput.addEventListener("input", updateTotalAmount);

  invoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const customerName = document.getElementById("customer-name").value;
    const invoiceNumber = document.getElementById("invoice-number").value;
    const invoiceDate = document.getElementById("invoice-date").value;
    const invoiceDiscount = parseFloat(invoiceDiscountInput.value) || 0;
    const invoiceAmount = parseFloat(invoiceAmountInput.value);

    const invoice = {
      customerName: customerName,
      number: invoiceNumber,
      date: invoiceDate,
      services: selectedServices,
      discount: invoiceDiscount,
      amount: invoiceAmount,
    };

    const invoicesDataPath = path.join(__dirname, "data", "invoices.json");
    let invoicesData = [];
    if (fs.existsSync(invoicesDataPath)) {
      invoicesData = JSON.parse(fs.readFileSync(invoicesDataPath));
    }

    invoicesData.push(invoice);

    fs.writeFileSync(invoicesDataPath, JSON.stringify(invoicesData, null, 2));

    alert("Račun kreiran!");
    invoiceForm.reset();
    selectedServices = [];
    invoiceServicesList.innerHTML = "";
    updateTotalAmount();
  });

  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });

  function updateTotalAmount() {
    let totalAmount = selectedServices.reduce(
      (total, service) => total + parseFloat(service.price),
      0
    );
    const discount = parseFloat(invoiceDiscountInput.value) || 0;
    if (discount > 0) {
      totalAmount = totalAmount * (1 - discount / 100);
    }
    invoiceAmountInput.value = totalAmount.toFixed(2);
  }
});
