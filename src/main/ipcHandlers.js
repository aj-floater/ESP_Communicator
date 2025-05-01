const { app } = require("electron");
const { ipcMain, ipcRenderer } = require("electron");
const { initializeBluetooth, writeHM10 } = require("./bluetooth");

// main.js
const fs = require('fs');
const path = require('path');
const dataPath = path.join(app.getPath('userData'), 'values.json');
console.log(dataPath);

function setupIPCHandlers() {
  ipcMain.on('start-connection', async () => {
    console.log('Start connection request.');
    initializeBluetooth();
  });

  ipcMain.on('write-data', (event, dataToSend) => {
    writeHM10(dataToSend);
  });

  ipcMain.on('disconnect-peripheral', async () => {
    if (global.peripheral) {
      try {
        console.log('Disconnecting peripheral via button...');
        await global.peripheral.disconnectAsync();
        console.log('Peripheral disconnected via button.');
        
        // Optionally, notify the renderer.
        mainWindow.webContents.send('disconnected', 'Peripheral disconnected.');
        // Clear the stored peripheral.
        global.peripheral = null;
        global.foundTargetCalled = false;
        // Redirect back to the connection page.
      } catch (err) {
        console.error('Error disconnecting peripheral:', err);
      }
    } else {
      console.log('No peripheral connected to disconnect.');
      await noble.stopScanningAsync();
    }
  });

  ipcMain.handle('load-values', () => {
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
      return [];
    }
  });
  ipcMain.on('save-values', (e, valueItems) => {
    fs.writeFileSync(dataPath, JSON.stringify(valueItems, null, 2));
  });
}

module.exports = { setupIPCHandlers };