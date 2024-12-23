const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const servicesDataPath = path.join(__dirname, "data", "services.json");
  const servicesData = JSON.parse(fs.readFileSync(servicesDataPath));

  const serviceList = document.getElementById("service-list");

  servicesData.forEach((service, index) => {
    const listItem = document.createElement("li");
    listItem.className =
      "list-group-item d-flex justify-content-between align-items-center";
    listItem.innerHTML = `
      <span>${service.name} - ${service.price} €</span>
      <div>
        <button class="btn btn-sm btn-danger delete-service" data-index="${index}">Izbriši</button>
      </div>
    `;
    serviceList.appendChild(listItem);
  });

  document.querySelectorAll(".delete-service").forEach((button) => {
    button.addEventListener("click", (event) => {
      const index = event.target.getAttribute("data-index");
      servicesData.splice(index, 1);
      fs.writeFileSync(servicesDataPath, JSON.stringify(servicesData, null, 2));
      window.location.reload();
    });
  });

  document.getElementById("back-button").addEventListener("click", () => {
    window.location.href = "hello.html";
  });
});
