const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { InvoiceGenerator } = require("./src/invoiceGenerator");
require("@electron/remote/main").initialize();

// Global references
let mainWindow;
const userDataPath = app.getPath("userData");

// Define all data file paths globally
global.paths = {
  companyData: path.join(userDataPath, "companyData.json"),
  invoices: path.join(userDataPath, "invoices.json"),
  services: path.join(userDataPath, "services.json"),
  customers: path.join(userDataPath, "customers.json"),
};

// Initialize data files if they don't exist
function ensureDataFilesExist() {
  const files = [
    { path: global.paths.companyData, defaultContent: "{}" },
    { path: global.paths.invoices, defaultContent: "[]" },
    { path: global.paths.services, defaultContent: "[]" },
    { path: global.paths.customers, defaultContent: "[]" },
  ];

  files.forEach((file) => {
    if (!fs.existsSync(file.path)) {
      try {
        fs.writeFileSync(file.path, file.defaultContent);
        console.log(`Created new data file: ${file.path}`);
      } catch (error) {
        console.error(`Failed to create data file ${file.path}:`, error);
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  require("@electron/remote/main").enable(mainWindow.webContents);

  // Check if company data exists to determine which page to load
  if (fs.existsSync(global.paths.companyData)) {
    try {
      const companyData = JSON.parse(fs.readFileSync(global.paths.companyData));
      if (Object.keys(companyData).length > 0) {
        mainWindow.loadFile(path.join(__dirname, "src", "hello.html"));
      } else {
        mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
      }
    } catch (error) {
      console.error("Error reading company data:", error);
      mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  }

  // Uncomment for development tools
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ensureDataFilesExist();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for data operations
ipcMain.on("save-company-data", (event, companyData) => {
  try {
    fs.writeFileSync(
      global.paths.companyData,
      JSON.stringify(companyData, null, 2)
    );
    event.sender.send("data-saved");
  } catch (error) {
    console.error("Error saving company data:", error);
    event.sender.send("data-save-error", error.message);
  }
});

// Generic save data handler
ipcMain.handle("save-data", async (event, { type, data }) => {
  try {
    if (!global.paths[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    fs.writeFileSync(global.paths[type], JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    return { success: false, error: error.message };
  }
});

// Generic get data handler
ipcMain.handle("get-data", async (event, type) => {
  try {
    if (!global.paths[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    if (!fs.existsSync(global.paths[type])) {
      return type === "companyData" ? {} : [];
    }

    const data = JSON.parse(fs.readFileSync(global.paths[type], "utf8"));
    return data;
  } catch (error) {
    console.error(`Error reading ${type} data:`, error);
    return type === "companyData" ? {} : [];
  }
});

// Get all data paths
ipcMain.handle("get-data-paths", () => {
  return global.paths;
});

// File dialogs
ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error("Error in save dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error("Error in open dialog:", error);
    return { canceled: true, error: error.message };
  }
});

// Get font data handler
ipcMain.handle("get-font-data", async (event, fontName) => {
  try {
    const fontPath = path.join(__dirname, "src", "fonts", `${fontName}.ttf`);
    const fontData = fs.readFileSync(fontPath, "base64");
    return fontData;
  } catch (error) {
    console.error(`Error loading font ${fontName}:`, error);
    return null;
  }
});

// Save PDF handler
ipcMain.handle("save-pdf", async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    console.error("Error saving PDF:", error);
    return { success: false, error: error.message };
  }
});

// Generate and save invoice PDF
ipcMain.handle("generate-invoice-pdf", async (event, { invoice, filePath }) => {
  try {
    // Get company data
    const companyData = JSON.parse(
      fs.readFileSync(global.paths.companyData, "utf8")
    );

    // Create invoice generator
    const generator = new InvoiceGenerator(companyData);
    const pdf = generator.generateInvoicePDF(invoice);

    // Save PDF
    const pdfData = pdf.output("arraybuffer");
    fs.writeFileSync(filePath, Buffer.from(pdfData));

    return { success: true };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
});

// Get Excel template handler
ipcMain.handle("get-excel-template", async () => {
  try {
    // Updated path to point to the new location
    const templatePath = path.join(
      __dirname,
      "src",
      "assets",
      "knjiga-prometa.xlsx"
    );
    const templateData = fs.readFileSync(templatePath);
    return templateData.buffer;
  } catch (error) {
    console.error("Error loading Excel template:", error);
    return null;
  }
});
