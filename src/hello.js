const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", async () => {
  const companyDataDiv = document.getElementById("company-data");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "alert alert-info";
  loadingIndicator.textContent = "Učitavanje podataka...";
  companyDataDiv.appendChild(loadingIndicator);

  try {
    // Get company data using IPC
    const companyData = await ipcRenderer.invoke("get-data", "companyData");

    // Update company info display
    companyDataDiv.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">${companyData.naziv}</h5>
          <p class="card-text">${companyData.opis}</p>
          <p class="card-text">vl. ${companyData.vlasnik}</p>
          <p class="card-text">${companyData.adresa}, ${companyData.grad}</p>
          <p class="card-text">OIB: ${companyData.oib}</p>
          <p class="card-text">IBAN: ${companyData.iban}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading company data:", error);
    companyDataDiv.innerHTML = `
      <div class="alert alert-danger">
        Greška pri učitavanju podataka: ${error.message}
      </div>
    `;
  }

  // Setup navigation buttons
  setupNavigationButton("add-service-button", "addService.html");
  setupNavigationButton("view-services-button", "viewServices.html");
  setupNavigationButton("create-invoice-button", "createInvoice.html");
  setupNavigationButton("view-invoices-button", "viewInvoices.html");
  setupNavigationButton("edit-company-button", "index.html");
  setupNavigationButton("customers-button", "viewCustomers.html");
  setupNavigationButton("reports-button", "viewInvoices.html");

  // Back button
  document.getElementById("back-button")?.addEventListener("click", () => {
    window.history.back();
  });

  // Helper function for button navigation
  function setupNavigationButton(buttonId, destination) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        window.location.href = destination;
      });
    }
  }
});
