const { jsPDF } = require("jspdf");

class InvoiceGenerator {
  constructor(companyData) {
    this.companyData = companyData;
  }

  generateInvoicePDF(invoice) {
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 123, 255); // Blue color
    doc.text("RAČUN", 20, 30);

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(this.companyData.naziv || "N/A", 20, 50);
    doc.text(`vl. ${this.companyData.vlasnik || "N/A"}`, 20, 60);
    doc.text(
      `${this.companyData.adresa || "N/A"}, ${this.companyData.grad || "N/A"}`,
      20,
      70
    );
    if (this.companyData.oib) {
      doc.text(`OIB: ${this.companyData.oib}`, 20, 80);
    }
    if (this.companyData.iban) {
      doc.text(`IBAN: ${this.companyData.iban}`, 20, 90);
    }

    // Invoice details
    doc.text(`Broj računa: ${invoice.number}`, 120, 50);
    doc.text(
      `Datum: ${new Date(invoice.date).toLocaleDateString("hr-HR")}`,
      120,
      60
    );
    doc.text(`Kupac: ${invoice.customerName}`, 120, 70);

    // Services table
    let yPosition = 110;
    doc.setFontSize(14);
    doc.text("Usluge:", 20, yPosition);

    yPosition += 20;
    doc.setFontSize(12);
    doc.text("Opis", 20, yPosition);
    doc.text("Cijena (€)", 150, yPosition);

    // Draw line under header
    doc.line(20, yPosition + 5, 190, yPosition + 5);
    yPosition += 15;

    let total = 0;
    invoice.services.forEach((service) => {
      doc.text(service.name, 20, yPosition);
      doc.text(service.price.toFixed(2), 150, yPosition);
      total += parseFloat(service.price);
      yPosition += 10;
    });

    // Total section
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition); // Line above total
    yPosition += 10;

    if (invoice.discount > 0) {
      doc.text(`Ukupno prije popusta: ${total.toFixed(2)} €`, 120, yPosition);
      yPosition += 10;
      doc.text(
        `Popust ${invoice.discount}%: -${(
          (total * invoice.discount) /
          100
        ).toFixed(2)} €`,
        120,
        yPosition
      );
      yPosition += 10;
    }

    doc.setFontSize(14);
    doc.text(`UKUPNO: ${invoice.discountedAmount} €`, 120, yPosition);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("Generirano pomoću Facturo aplikacije", 20, 280);

    return doc;
  }
}

module.exports = { InvoiceGenerator };
