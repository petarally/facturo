const { ipcRenderer, remote } = require("electron");

window.addEventListener("DOMContentLoaded", async () => {
  const serviceForm = document.getElementById("service-form");
  const backButton = document.getElementById("back-button");
  const submitButton = serviceForm.querySelector('button[type="submit"]');

  // Create feedback element
  const feedbackEl = document.createElement("div");
  feedbackEl.className = "alert mt-3";
  feedbackEl.style.display = "none";
  serviceForm.appendChild(feedbackEl);

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

  // Validate service inputs
  function validateService(name, price) {
    if (!name.trim()) {
      showFeedback("Naziv usluge je obvezan", true);
      return false;
    }

    if (!price.trim()) {
      showFeedback("Cijena usluge je obvezna", true);
      return false;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      showFeedback("Cijena mora biti pozitivan broj", true);
      return false;
    }

    return true;
  }

  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedbackEl.style.display = "none";

    const serviceName = document.getElementById("service-name").value;
    const servicePrice = document.getElementById("service-price").value;

    // Validate inputs
    if (!validateService(serviceName, servicePrice)) {
      return;
    }

    const service = {
      name: serviceName,
      price: parseFloat(servicePrice),
    };

    // Disable button while saving
    submitButton.disabled = true;
    submitButton.textContent = "Spremanje...";

    try {
      // Get existing services
      const services = await ipcRenderer.invoke("get-data", "services");

      // Add new service
      services.push(service);

      // Save updated services
      const result = await ipcRenderer.invoke("save-data", {
        type: "services",
        data: services,
      });

      if (result.success) {
        showFeedback("Usluga uspješno dodana!");
        serviceForm.reset();
      } else {
        showFeedback(`Greška: ${result.error}`, true);
      }
    } catch (error) {
      console.error("Error saving service:", error);
      showFeedback("Došlo je do pogreške prilikom spremanja usluge.", true);
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      submitButton.textContent = "Dodaj uslugu";
    }
  });

  backButton.addEventListener("click", () => {
    window.history.back();
  });
});
