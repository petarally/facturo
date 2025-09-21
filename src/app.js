// Form elements
const companyForm = document.getElementById("company-form");
const submitButton = companyForm.querySelector('button[type="submit"]');
const statusMessage = document.createElement("div");
statusMessage.className = "alert mt-3";
companyForm.appendChild(statusMessage);

// Validate OIB (Croatian tax number) - proper validation with checksum
function validateOIB(oib) {
  // Remove all non-digit characters
  const cleanOib = oib.replace(/\D/g, "");

  if (cleanOib.length !== 11) {
    return false;
  }

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanOib[i]) * (10 - i);
  }

  const remainder = sum % 11;
  let checksum = 11 - remainder;
  if (checksum === 10 || checksum === 11) {
    checksum = 0;
  }

  return checksum === parseInt(cleanOib[10]);
}

// Validate IBAN - proper format check with basic validation
function validateIBAN(iban) {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, "").toUpperCase();

  // Check basic format (HR followed by 19 digits for Croatian IBAN)
  if (!cleanIBAN.match(/^HR\d{19}$/)) {
    return false;
  }

  // Basic IBAN check digit validation would be more complex
  // For now, just check format
  return true;
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>&"']/g, function (char) {
    const htmlEntities = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return htmlEntities[char];
  });
}

function showMessage(message, isError = false) {
  statusMessage.innerHTML = `${isError ? "⚠️" : "⭐"} ${message}`;
  statusMessage.className = `alert ${
    isError ? "alert-danger" : "alert-success"
  } mt-3`;
  statusMessage.style.display = "block";
}

// Add helper function to reset submit button
function resetSubmitButton() {
  submitButton.disabled = false;
  submitButton.textContent = "✨ Spremi podatke ⭐";
  submitButton.classList.remove("btn-secondary");
  submitButton.classList.add("btn-primary");
}

companyForm.addEventListener("submit", function (event) {
  event.preventDefault();
  statusMessage.style.display = "none";

  // Get form values and sanitize
  const companyName = sanitizeInput(
    document.getElementById("company-name").value
  );
  const companyDescription = sanitizeInput(
    document.getElementById("company-description").value
  );
  const companyOwner = sanitizeInput(
    document.getElementById("company-owner").value
  );
  const companyCity = sanitizeInput(
    document.getElementById("company-city").value
  );
  const companyAddress = sanitizeInput(
    document.getElementById("company-address").value
  );
  const companyOib = sanitizeInput(
    document.getElementById("company-oib").value
  );
  const companyIban = sanitizeInput(
    document.getElementById("company-iban").value
  );
  const companyCode = sanitizeInput(
    document.getElementById("company-code").value
  );

  // Enhanced validation
  if (!companyName) {
    showMessage("Naziv tvrtke je obvezan", true);
    document.getElementById("company-name").focus();
    return;
  }

  if (companyName.length < 2) {
    showMessage("Naziv tvrtke mora imati najmanje 2 znaka", true);
    document.getElementById("company-name").focus();
    return;
  }

  if (!companyOwner) {
    showMessage("Ime vlasnika je obvezno", true);
    document.getElementById("company-owner").focus();
    return;
  }

  if (companyOwner.length < 2) {
    showMessage("Ime vlasnika mora imati najmanje 2 znaka", true);
    document.getElementById("company-owner").focus();
    return;
  }

  if (companyOib && !validateOIB(companyOib)) {
    showMessage(
      "OIB nije ispravan. Molimo unesite važeći OIB od 11 znamenki",
      true
    );
    document.getElementById("company-oib").focus();
    return;
  }

  if (companyIban && !validateIBAN(companyIban)) {
    showMessage(
      "IBAN nije u ispravnom formatu. Molimo unesite važeći hrvatski IBAN (HR + 19 znamenki)",
      true
    );
    document.getElementById("company-iban").focus();
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
  submitButton.textContent = "⏳ Spremanje...";

  // Add visual feedback
  submitButton.classList.add("btn-secondary");
  submitButton.classList.remove("btn-primary");

  // Save data
  try {
    window.electronAPI.saveCompanyData(companyData);
  } catch (error) {
    console.error("Error calling save API:", error);
    showMessage("Greška prilikom komunikacije s aplikacijom", true);
    resetSubmitButton();
  }
});

// Success handler
window.electronAPI.onDataSaved(() => {
  showMessage("Podaci uspješno spremljeni!");
  setTimeout(() => {
    window.location.href = "hello.html";
  }, 1500);
});

// Error handler
window.electronAPI.onDataSaveError((_, errorMessage) => {
  resetSubmitButton();
  showMessage(`Greška prilikom spremanja: ${errorMessage}`, true);
});

// Helper function to reset submit button
function resetSubmitButton() {
  submitButton.disabled = false;
  submitButton.textContent = "✨ Spremi podatke ⭐";
  submitButton.classList.remove("btn-secondary");
  submitButton.classList.add("btn-primary");
}
