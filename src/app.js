const { ipcRenderer } = require("electron");

document
  .getElementById("company-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const companyName = document.getElementById("company-name").value;
    const companyDescription = document.getElementById(
      "company-description"
    ).value;
    const companyOwner = document.getElementById("company-owner").value;
    const companyCity = document.getElementById("company-city").value;
    const companyAddress = document.getElementById("company-address").value;
    const companyOib = document.getElementById("company-oib").value;
    const companyIban = document.getElementById("company-iban").value;
    const companyCode = document.getElementById("company-code").value;

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

    ipcRenderer.send("save-company-data", companyData);
  });

ipcRenderer.on("data-saved", () => {
  window.location = "hello.html";
});
