const { app, BrowserWindow } = require('electron');
const noble = require('noble');

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,  // Note: enable node integration if needed
      contextIsolation: false // Disable context isolation if using nodeIntegration
    }
  });

  // Load the index.html of the app.
  win.loadFile('index.html');

  // Optionally open the DevTools.
  // win.webContents.openDevTools();
}

// Called when Electron has finished initialization.
app.whenReady().then(() => {
  createWindow();

  noble.on('stateChange', state => {
    if (state === 'poweredOn') {
      noble.startScanning([], false);
    } else {
      noble.stopScanning();
    }
  });

  noble.on('discover', peripheral => {
    const serviceUUIDs = peripheral.advertisement.serviceUuids;
    // Send the UUIDs to the renderer process
    win.webContents.send('service-uuids', serviceUUIDs);
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});