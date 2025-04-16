const { ipcRenderer } = require("electron");

// Form elements
const companyForm = document.getElementById("company-form");
const submitButton = companyForm.querySelector('button[type="submit"]');
const statusMessage = document.createElement("div");
statusMessage.className = "alert mt-3";
companyForm.appendChild(statusMessage);

// Validate OIB (Croatian tax number) - simple length check
function validateOIB(oib) {
  return oib.length === 11 && /^\d+$/.test(oib);
}

// Validate IBAN - simple format check
function validateIBAN(iban) {
  // Remove spaces for checking
  const cleanIBAN = iban.replace(/\s/g, "");
  return /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleanIBAN);
}

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = `alert ${
    isError ? "alert-danger" : "alert-success"
  } mt-3`;
  statusMessage.style.display = "block";
}

companyForm.addEventListener("submit", function (event) {
  event.preventDefault();
  statusMessage.style.display = "none";

  // Get form values
  const companyName = document.getElementById("company-name").value.trim();
  const companyDescription = document
    .getElementById("company-description")
    .value.trim();
  const companyOwner = document.getElementById("company-owner").value.trim();
  const companyCity = document.getElementById("company-city").value.trim();
  const companyAddress = document
    .getElementById("company-address")
    .value.trim();
  const companyOib = document.getElementById("company-oib").value.trim();
  const companyIban = document.getElementById("company-iban").value.trim();
  const companyCode = document.getElementById("company-code").value.trim();

  // Validation
  if (!companyName) {
    showMessage("Naziv tvrtke je obvezan", true);
    return;
  }

  if (!companyOwner) {
    showMessage("Ime vlasnika je obvezno", true);
    return;
  }

  if (companyOib && !validateOIB(companyOib)) {
    showMessage("OIB mora sadržavati točno 11 brojeva", true);
    return;
  }

  if (companyIban && !validateIBAN(companyIban)) {
    showMessage("IBAN nije u ispravnom formatu", true);
    return;
  }

  const companyData = {
    naziv: companyName,
    opis: companyDescription,
    vlasnik: companyOwner,
    grad: companyCity,
    adresa: companyAddress,
    oib: companyOib,
    iban: companyIban,
    kod_djelatnosti: companyCode,
  };

  // Disable form while submitting
  submitButton.disabled = true;
  submitButton.textContent = "Spremanje...";

  // Save data
  ipcRenderer.send("save-company-data", companyData);
});

// Success handler
ipcRenderer.on("data-saved", () => {
  showMessage("Podaci uspješno spremljeni!");
  setTimeout(() => {
    window.location.href = "hello.html";
  }, 1000);
});

// Error handler
ipcRenderer.on("data-save-error", (_, errorMessage) => {
  submitButton.disabled = false;
  submitButton.textContent = "Spremi";
  showMessage(`Greška prilikom spremanja: ${errorMessage}`, true);
});
