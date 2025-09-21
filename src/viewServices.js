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

window.addEventListener("DOMContentLoaded", async () => {
  const serviceList = document.getElementById("service-list");

  // Show loading indicator
  serviceList.innerHTML = `
    <div class="text-center p-3">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Učitavanje...</span>
      </div>
      <p class="mt-2">Učitavanje usluga...</p>
    </div>
  `;

  try {
    // Get services data through secure API
    const servicesData = await window.electronAPI.getData("services");

    // Clear loading indicator
    serviceList.innerHTML = "";

    if (servicesData.length === 0) {
      serviceList.innerHTML = `
        <li class="list-group-item text-center text-muted">
          Nema dostupnih usluga. Dodajte novu uslugu.
        </li>
      `;
      return;
    }

    // Populate services list
    servicesData.forEach((service, index) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";
      listItem.innerHTML = `
        <div>
          <strong>${service.name}</strong>
          <span class="badge badge-primary ml-2">${service.price} €</span>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary edit-service" data-index="${index}">
            <i class="fa fa-pencil"></i> Uredi
          </button>
          <button class="btn btn-sm btn-danger delete-service" data-index="${index}">
            <i class="fa fa-trash"></i> Izbriši
          </button>
        </div>
      `;
      serviceList.appendChild(listItem);
    });

    // Setup delete buttons
    document.querySelectorAll(".delete-service").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const index = parseInt(event.target.getAttribute("data-index"));
        const serviceName = servicesData[index].name;

        // Show confirmation dialog
        const confirmDelete = confirm(
          `Jeste li sigurni da želite izbrisati uslugu "${serviceName}"?`
        );

        if (confirmDelete) {
          try {
            // Remove from array
            servicesData.splice(index, 1);

            // Update via secure API
            const result = await window.electronAPI.saveData(
              "services",
              servicesData
            );

            if (result.success) {
              // Remove from DOM without reload
              const listItem = button.closest("li");
              listItem.style.backgroundColor = "#ffdddd";
              listItem.style.transition = "opacity 0.5s ease";

              setTimeout(() => {
                listItem.style.opacity = "0";
                setTimeout(() => {
                  listItem.remove();

                  // Show empty message if no services left
                  if (serviceList.children.length === 0) {
                    serviceList.innerHTML = `
                      <li class="list-group-item text-center text-muted">
                        Nema dostupnih usluga. Dodajte novu uslugu.
                      </li>
                    `;
                  }
                }, 500);
              }, 300);

              showFeedback(`Usluga "${serviceName}" je uspješno izbrisana.`);
            } else {
              throw new Error(result.error || "Greška pri brisanju usluge");
            }
          } catch (error) {
            console.error("Error deleting service:", error);
            showFeedback(`Greška pri brisanju usluge: ${error.message}`, true);
          }
        }
      });
    });

    // Setup edit buttons
    document.querySelectorAll(".edit-service").forEach((button) => {
      button.addEventListener("click", (event) => {
        const index = event.target.getAttribute("data-index");
        window.location.href = `addService.html?edit=${index}`;
      });
    });
  } catch (error) {
    console.error("Error loading services:", error);
    serviceList.innerHTML = `
      <li class="list-group-item text-danger">
        Greška pri učitavanju usluga: ${error.message}
      </li>
    `;
  }

  // Back button handler
  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "hello.html";
  });

  // Bottom back button handler
  document
    .getElementById("back-button-bottom")
    ?.addEventListener("click", () => {
      window.location.href = "hello.html";
    });

  // Add service button handler
  document
    .getElementById("add-service-button")
    .addEventListener("click", () => {
      window.location.href = "addService.html";
    });
});
