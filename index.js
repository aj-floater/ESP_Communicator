const { app, BrowserWindow } = require('electron');
const noble = require('@abandonware/noble');

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

  noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      await noble.startScanningAsync([], false);
    }
  });

  noble.on('discover', async (peripheral) => {
    await peripheral.connectAsync();
  
    const deviceInfo = {
      id: peripheral.id,
      address: peripheral.address || 'unknown',
      addressType: peripheral.addressType || 'unknown',
      connectable: peripheral.connectable, // may be true, false, or undefined
      advertisement: {
        localName: peripheral.advertisement.localName,
        txPowerLevel: peripheral.advertisement.txPowerLevel,
        serviceUuids: peripheral.advertisement.serviceUuids,
        serviceSolicitationUuid: peripheral.advertisement.serviceSolicitationUuid,
        manufacturerData: peripheral.advertisement.manufacturerData,
        serviceData: peripheral.advertisement.serviceData
      },
      rssi: peripheral.rssi,
      mtu: peripheral.mtu !== undefined ? peripheral.mtu : null // MTU is null until connected and hci-socket is used
    };
  
    console.log(JSON.stringify(deviceInfo, null, 2));
  
    await peripheral.disconnectAsync();
  });  
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});