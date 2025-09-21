const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Company data operations
  saveCompanyData: (data) => ipcRenderer.send("save-company-data", data),
  onDataSaved: (callback) => ipcRenderer.on("data-saved", callback),
  onDataSaveError: (callback) => ipcRenderer.on("data-save-error", callback),

  // Generic data operations
  saveData: (type, data) => ipcRenderer.invoke("save-data", { type, data }),
  getData: (type) => ipcRenderer.invoke("get-data", type),
  getDataPaths: () => ipcRenderer.invoke("get-data-paths"),

  // Dialog operations
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),

  // Font and file operations
  getFontData: (fontName) => ipcRenderer.invoke("get-font-data", fontName),
  savePdf: (filePath, data) =>
    ipcRenderer.invoke("save-pdf", { filePath, data }),
  generateInvoicePdf: (invoice, filePath) =>
    ipcRenderer.invoke("generate-invoice-pdf", { invoice, filePath }),
  getExcelTemplate: () => ipcRenderer.invoke("get-excel-template"),

  // Remove listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
