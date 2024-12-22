const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const servicesDataPath = path.join(__dirname, "data", "services.json");

  const serviceList = document.getElementById("service-list");
  if (fs.existsSync(servicesDataPath)) {
    const servicesData = JSON.parse(fs.readFileSync(servicesDataPath));
    servicesData.forEach((service) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${service.name}: ${service.price} €`;
      listItem.classList.add("list-group-item");
      serviceList.appendChild(listItem);
    });
  }

  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });
});
