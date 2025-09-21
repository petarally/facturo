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

  // Enhanced validation with duplicate checking
  async function validateService(name, price) {
    const cleanName = sanitizeInput(name);
    const cleanPrice = sanitizeInput(price);

    if (!cleanName) {
      showFeedback("Naziv usluge je obvezan", true);
      document.getElementById("service-name").focus();
      return false;
    }

    if (cleanName.length < 2) {
      showFeedback("Naziv usluge mora imati najmanje 2 znaka", true);
      document.getElementById("service-name").focus();
      return false;
    }

    if (!cleanPrice) {
      showFeedback("Cijena usluge je obvezna", true);
      document.getElementById("service-price").focus();
      return false;
    }

    const priceValue = parseFloat(cleanPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      showFeedback("Cijena mora biti pozitivan broj", true);
      document.getElementById("service-price").focus();
      return false;
    }

    if (priceValue > 999999) {
      showFeedback("Cijena ne može biti veća od 999,999", true);
      document.getElementById("service-price").focus();
      return false;
    }

    // Check for duplicates
    try {
      const existingServices = await window.electronAPI.getData("services");
      const duplicate = existingServices.find(
        (service) => service.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (duplicate) {
        showFeedback("Usluga s tim nazivom već postoji", true);
        document.getElementById("service-name").focus();
        return false;
      }
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      showFeedback("Greška prilikom provjere duplikata", true);
      return false;
    }

    return { name: cleanName, price: priceValue };
  }

  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedbackEl.style.display = "none";

    const serviceName = document.getElementById("service-name").value;
    const servicePrice = document.getElementById("service-price").value;

    // Validate inputs with enhanced validation
    const validatedData = await validateService(serviceName, servicePrice);
    if (!validatedData) {
      return;
    }

    const service = {
      name: validatedData.name,
      price: validatedData.price,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString(),
    };

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = "Spremanje...";
    submitButton.classList.add("btn-secondary");
    submitButton.classList.remove("btn-primary");

    try {
      // Get existing services
      const services = await window.electronAPI.getData("services");

      // Add new service
      services.push(service);

      // Save updated services
      const result = await window.electronAPI.saveData("services", services);

      if (result.success) {
        showFeedback("Usluga uspješno dodana!");
        serviceForm.reset();
        document.getElementById("service-name").focus();
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
      submitButton.classList.remove("btn-secondary");
      submitButton.classList.add("btn-primary");
    }
  });

  backButton.addEventListener("click", () => {
    window.location.href = "hello.html";
  });
});
