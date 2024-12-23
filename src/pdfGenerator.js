const fs = require("fs");
const path = require("path");
const { ipcMain } = require("electron");
const pdf = require("html-pdf-node");

ipcMain.handle(
  "generate-pdf",
  async (event, { htmlContent, invoiceNumber, customerName }) => {
    const options = { format: "A4", printBackground: true };
    const file = { content: htmlContent };

    try {
      const invoiceNumberPart = invoiceNumber.split("/")[0];
      const pdfDir = path.join(__dirname, "pdfs");
      const pdfPath = path.join(
        pdfDir,
        `racun ${invoiceNumberPart} - ${customerName}.pdf`
      );

      // Ensure the directory exists
      fs.mkdirSync(pdfDir, { recursive: true });

      // Generate the PDF buffer
      const pdfBuffer = await pdf.generatePdf(file, options);

      // Write the PDF buffer to a file
      fs.writeFileSync(pdfPath, pdfBuffer);
      return pdfPath;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }
);
