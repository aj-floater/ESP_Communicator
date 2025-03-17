const { ipcMain, ipcRenderer } = require("electron");
const { initializeBluetooth, writeHM10 } = require("./bluetooth");

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
        mainWindow.loadFile('src/views/start-page.html');
      } catch (err) {
        console.error('Error disconnecting peripheral:', err);
      }
    } else {
      console.log('No peripheral connected to disconnect.');
      await noble.stopScanningAsync();
      mainWindow.loadFile('src/views/start-page.html');
    }
  });

  // Listen for characteristic data updates
  ipcMain.on('characteristic-read', (event, originalData, floatArray, valueStruct) => {
    let output = "";
    valueStruct.forEach(item => {
      output += `${item.name}: ${item.value}\n`;
    });
    document.getElementById('dataOutput').innerText = output;

    // Update global latest values for the chart
    window.latestLeft = floatArray[0];
    window.latestRight = floatArray[1];
  });
}

module.exports = { setupIPCHandlers };