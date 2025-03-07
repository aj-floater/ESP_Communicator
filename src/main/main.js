const { app } = require("electron");
const { createMainWindow } = require("./windows");
const { setupIPCHandlers } = require("./ipcHandlers");
const { startHIDListening } = require("./hid");
const { initializeBluetooth } = require("./bluetooth");

app.whenReady().then(() => {
  createMainWindow();
  setupIPCHandlers();
  startHIDListening(6353, 37888);
  initializeBluetooth();
});

app.on('before-quit', async () => {
  if (global.peripheral) {
    try {
      console.log('Disconnecting peripheral before quit...');
      await global.peripheral.disconnectAsync();
      console.log('Peripheral disconnected.');
    } catch (err) {
      console.error('Error disconnecting peripheral before quit:', err);
    }
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

process.on('SIGINT', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});

process.on('SIGQUIT', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});

process.on('SIGTERM', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});