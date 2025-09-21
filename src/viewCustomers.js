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
  const customerList = document.getElementById("customer-list");
  const searchInput = document.getElementById("search-customers");

  // Show loading indicator
  customerList.innerHTML = `
    <div class="text-center p-3">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Učitavanje...</span>
      </div>
      <p class="mt-2">Učitavanje klijenata...</p>
    </div>
  `;

  let customersData = [];
  let invoiceCustomers = [];

  try {
    // Get both customer data and invoice data through secure API
    const [customers, invoices] = await Promise.all([
      window.electronAPI.getData("customers"),
      window.electronAPI.getData("invoices"),
    ]);

    customersData = customers || [];

    // Extract unique customers from invoices
    if (invoices && invoices.length > 0) {
      // Create a Set to track seen customer names for deduplication
      const seenCustomerNames = new Set(
        customersData.map((c) => c.name.toLowerCase())
      );

      invoices.forEach((invoice) => {
        if (
          invoice.customerName &&
          !seenCustomerNames.has(invoice.customerName.toLowerCase())
        ) {
          // Found a new customer in invoices
          seenCustomerNames.add(invoice.customerName.toLowerCase());

          // Create simplified customer record from invoice
          invoiceCustomers.push({
            name: invoice.customerName,
            address: invoice.customerAddress || "",
            city: invoice.customerCity || "",
            oib: invoice.customerOib || "",
            // These fields won't be available from invoices typically
            phone: "",
            email: "",
          });
        }
      });

      // Show feedback if we found additional customers
      if (invoiceCustomers.length > 0) {
        showFeedback(
          `Pronađeno ${invoiceCustomers.length} dodatnih klijenata iz računa.`
        );
      }
    }

    // Merge customer lists for display
    const allCustomers = [...customersData, ...invoiceCustomers];

    // Render the combined customer list
    renderCustomerList(allCustomers);

    // Add search functionality
    searchInput.addEventListener("input", (event) => {
      const searchTerm = event.target.value.toLowerCase().trim();

      if (!searchTerm) {
        renderCustomerList(allCustomers);
        return;
      }

      const filteredCustomers = allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchTerm)) ||
          (customer.oib && customer.oib.includes(searchTerm))
      );

      renderCustomerList(filteredCustomers);
    });

    // Add new customer button
    document
      .getElementById("add-customer-button")
      .addEventListener("click", () => {
        // Clear the form
        document.getElementById("customer-form").reset();
        document.getElementById("customer-index").value = "";
        document.getElementById("customer-source").value = "new";
        document.getElementById("customerModalLabel").textContent =
          "Dodaj novog klijenta";

        // Show the modal
        $("#customerModal").modal("show");
      });

    // Save customer button
    document
      .getElementById("save-customer-button")
      .addEventListener("click", async () => {
        const form = document.getElementById("customer-form");

        // Basic validation
        if (!document.getElementById("customer-name").value.trim()) {
          showFeedback("Naziv klijenta je obavezan", true);
          return;
        }

        const customerIndex = document.getElementById("customer-index").value;
        const customerSource = document.getElementById("customer-source").value;
        const isNewCustomer = customerSource === "new";

        // Gather form data
        const customerData = {
          name: document.getElementById("customer-name").value.trim(),
          address: document.getElementById("customer-address").value.trim(),
          city: document.getElementById("customer-city").value.trim(),
          phone: document.getElementById("customer-phone").value.trim(),
          email: document.getElementById("customer-email").value.trim(),
          oib: document.getElementById("customer-oib").value.trim(),
        };

        try {
          if (isNewCustomer) {
            // Add new customer
            customersData.push(customerData);
          } else if (customerSource === "customers") {
            // Update existing customer in customersData
            customersData[parseInt(customerIndex)] = customerData;
          } else if (customerSource === "invoices") {
            // This is an invoice-derived customer we're saving to the customers database
            customersData.push(customerData);

            // Remove from invoiceCustomers list
            invoiceCustomers = invoiceCustomers.filter(
              (_, idx) => idx !== parseInt(customerIndex)
            );
          }

          // Save through secure API - only save customersData, not invoiceCustomers
          const result = await window.electronAPI.saveData(
            "customers",
            customersData
          );

          if (result.success) {
            // Close modal
            $("#customerModal").modal("hide");

            // Update the UI with combined data
            const allCustomers = [...customersData, ...invoiceCustomers];
            renderCustomerList(allCustomers);

            // Show success message
            showFeedback(
              isNewCustomer
                ? "Klijent uspješno dodan"
                : "Klijent uspješno ažuriran"
            );
          } else {
            throw new Error(result.error || "Error saving customer data");
          }
        } catch (error) {
          console.error("Error saving customer:", error);
          showFeedback(`Greška pri spremanju: ${error.message}`, true);
        }
      });

    // Back button handler
    document.getElementById("back-button").addEventListener("click", () => {
      window.location.href = "hello.html";
    });
  } catch (error) {
    console.error("Error loading customers:", error);
    customerList.innerHTML = `
      <li class="list-group-item text-danger">
        Greška pri učitavanju klijenata: ${error.message}
      </li>
    `;
  }

  function renderCustomerList(customers) {
    if (customers.length === 0) {
      customerList.innerHTML = `
        <li class="list-group-item text-center text-muted">
          Nema dostupnih klijenata. Dodajte novog klijenta.
        </li>
      `;
      return;
    }

    // Clear previous list
    customerList.innerHTML = "";

    // Add customers to the list
    customers.forEach((customer, index) => {
      // Determine if this is from invoices or customer database
      const isFromInvoice = index >= customersData.length;
      const sourceClass = isFromInvoice ? "badge-info" : "badge-success";
      const sourceText = isFromInvoice ? "Račun" : "Klijent";

      const listItem = document.createElement("li");
      listItem.className = "list-group-item customer-item";
      listItem.innerHTML = `
        <div class="row">
          <div class="col-5">
            <strong>${customer.name}</strong>
            <span class="badge ${sourceClass} ml-2">${sourceText}</span>
            ${
              customer.oib
                ? `<br><small class="text-muted">OIB: ${customer.oib}</small>`
                : ""
            }
          </div>
          <div class="col-4">
            ${
              customer.email
                ? `<div><i class="fa fa-envelope"></i> ${customer.email}</div>`
                : ""
            }
            ${
              customer.phone
                ? `<div><i class="fa fa-phone"></i> ${customer.phone}</div>`
                : ""
            }
            ${
              customer.address
                ? `<small>${customer.address}, ${customer.city || ""}</small>`
                : ""
            }
          </div>
          <div class="col-3 text-right">
            <button class="btn btn-sm btn-outline-secondary edit-customer" 
                data-index="${index}" 
                data-source="${isFromInvoice ? "invoices" : "customers"}">
              <i class="fa fa-pencil"></i> Uredi
            </button>
            ${
              !isFromInvoice
                ? `
            <button class="btn btn-sm btn-danger delete-customer" data-index="${index}">
              <i class="fa fa-trash"></i> Izbriši
            </button>
            `
                : ""
            }
          </div>
        </div>
      `;

      customerList.appendChild(listItem);
    });

    // Add edit functionality
    document.querySelectorAll(".edit-customer").forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index"));
        const source = e.currentTarget.getAttribute("data-source");

        // Get customer from appropriate array
        const customer =
          source === "invoices"
            ? invoiceCustomers[index - customersData.length]
            : customersData[index];

        // Fill the form with customer data
        document.getElementById("customer-index").value =
          source === "invoices"
            ? index - customersData.length // Index in invoiceCustomers array
            : index; // Index in customersData array
        document.getElementById("customer-source").value = source;
        document.getElementById("customer-name").value = customer.name || "";
        document.getElementById("customer-address").value =
          customer.address || "";
        document.getElementById("customer-city").value = customer.city || "";
        document.getElementById("customer-phone").value = customer.phone || "";
        document.getElementById("customer-email").value = customer.email || "";
        document.getElementById("customer-oib").value = customer.oib || "";

        // Update modal title based on source
        document.getElementById("customerModalLabel").textContent =
          source === "invoices" ? "Dodaj iz računa" : "Uredi klijenta";

        // Show the modal
        $("#customerModal").modal("show");
      });
    });

    // Add delete functionality - only for customers in the customer database
    document.querySelectorAll(".delete-customer").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const index = parseInt(e.currentTarget.getAttribute("data-index"));
        const customerName = customersData[index].name;

        if (
          confirm(
            `Jeste li sigurni da želite izbrisati klijenta "${customerName}"?`
          )
        ) {
          try {
            // Remove from array
            customersData.splice(index, 1);

            // Save through IPC
            const result = await window.electronAPI.saveData(
              "customers",
              customersData
            );

            if (result.success) {
              // Update UI with combined data
              const allCustomers = [...customersData, ...invoiceCustomers];
              renderCustomerList(allCustomers);
              showFeedback(`Klijent "${customerName}" je uspješno obrisan.`);
            } else {
              throw new Error(result.error || "Error deleting customer");
            }
          } catch (error) {
            console.error("Error deleting customer:", error);
            showFeedback(`Greška pri brisanju: ${error.message}`, true);
          }
        }
      });
    });
  }
});
