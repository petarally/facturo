window.addEventListener("DOMContentLoaded", async () => {
  const companyDataDiv = document.getElementById("company-data");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "alert alert-info";
  loadingIndicator.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Učitavanje...</span>
      </div>
      Učitavanje podataka...
    </div>
  `;
  companyDataDiv.appendChild(loadingIndicator);

  try {
    // Get company data using secure API
    const companyData = await window.electronAPI.getData("companyData");

    if (!companyData || Object.keys(companyData).length === 0) {
      companyDataDiv.innerHTML = `
        <div class="alert alert-warning">
          <h5>Nema podataka o obrtu</h5>
          <p>Molimo unesite osnovne podatke o obrtu prije korištenja aplikacije.</p>
          <a href="index.html" class="btn btn-primary">Unesite podatke</a>
        </div>
      `;
      return;
    }

    // Update company info display with enhanced layout
    companyDataDiv.innerHTML = `
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">Podaci o obrtu</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-primary">${companyData.naziv || "N/A"}</h6>
              <p class="text-muted mb-2">${companyData.opis || "Nema opisa"}</p>
              <p class="mb-1"><strong>Vlasnik:</strong> ${
                companyData.vlasnik || "N/A"
              }</p>
              <p class="mb-1"><strong>Adresa:</strong> ${
                companyData.adresa || "N/A"
              }, ${companyData.grad || "N/A"}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-1"><strong>OIB:</strong> ${
                companyData.oib || "Nije uneseno"
              }</p>
              <p class="mb-1"><strong>IBAN:</strong> ${
                companyData.iban || "Nije uneseno"
              }</p>
              <p class="mb-1"><strong>Kod djelatnosti:</strong> ${
                companyData.kod_djelatnosti || "Nije uneseno"
              }</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error loading company data:", error);
    companyDataDiv.innerHTML = `
      <div class="alert alert-danger">
        <h5>Greška pri učitavanju podataka</h5>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Pokušaj ponovo</button>
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

  // Helper function for button navigation with improved error handling
  function setupNavigationButton(buttonId, destination) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        try {
          window.location.href = destination;
        } catch (error) {
          console.error(`Navigation error for button ${buttonId}:`, error);
          alert(`Greška pri navigaciji: ${error.message}`);
        }
      });
    } else {
      console.warn(`Button with ID '${buttonId}' not found`);
    }
  }
});
