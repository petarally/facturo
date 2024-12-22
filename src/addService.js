const fs = require("fs");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const servicesDataPath = path.join(__dirname, "data", "services.json");

  document
    .getElementById("service-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      const serviceName = document.getElementById("service-name").value;
      const servicePrice = document.getElementById("service-price").value;

      const service = {
        name: serviceName,
        price: servicePrice,
      };

      let servicesData = [];
      if (fs.existsSync(servicesDataPath)) {
        servicesData = JSON.parse(fs.readFileSync(servicesDataPath));
      }

      servicesData.push(service);

      fs.writeFileSync(servicesDataPath, JSON.stringify(servicesData, null, 2));

      alert("Usluga dodana!");
      document.getElementById("service-form").reset();
    });

  document.getElementById("back-button").addEventListener("click", () => {
    window.history.back();
  });
});
