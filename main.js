const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
require("@electron/remote/main").initialize();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  require("@electron/remote/main").enable(mainWindow.webContents);

  const dataPath = path.join(__dirname, "src", "data", "companyData.json");

  if (fs.existsSync(dataPath)) {
    mainWindow.loadFile(path.join(__dirname, "src", "hello.html"));
  } else {
    mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  }
}

app.whenReady().then(createWindow);

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

ipcMain.on("save-company-data", (event, companyData) => {
  const dataDir = path.join(__dirname, "src", "data");
  const dataPath = path.join(dataDir, "companyData.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  fs.writeFileSync(dataPath, JSON.stringify(companyData, null, 2));

  // Send a message back to the renderer process to redirect to hello.html
  event.sender.send("data-saved");
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});
