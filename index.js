const { app, BrowserWindow, ipcMain } = require('electron');
const noble = require('@abandonware/noble');
const chart = require('chart.js');

let mainWindow;
const TARGET_PERIPHERAL_ID = '00714d08a544acaa4df2c5fc84c060ed';

// Global array to store discovered peripherals.
global.peripheralList = [];
// A flag to prevent duplicate processing of the target peripheral.
global.foundTargetCalled = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',  
    backgroundColor: '#16191d',  
    trafficLightPosition: { x: 10, y: 10 } 
  });
  global.mainWindow = mainWindow; // Make mainWindow global for use in connected.js
  mainWindow.loadFile('index.html');
}

// Helper function to search through global.peripheralList
function checkForTarget() {
  // Look for a peripheral in the list whose id matches TARGET_PERIPHERAL_ID
  const target = global.peripheralList.find(p => p.id === TARGET_PERIPHERAL_ID);
  if (target) {
    console.log('Target peripheral found in list:', target.id);
    // Execute foundTarget function with the target peripheral.
    foundTarget(target);
    return true;
  } else {
    console.log('Target peripheral not found in the list yet.');
    return false;
  }
}

// This function contains the "found target" logic.
async function foundTarget(peripheral) {
  if (global.foundTargetCalled) return; // Prevent duplicate processing.
  global.foundTargetCalled = true;

  console.log('Found target peripheral:', peripheral.id);
  global.peripheral = peripheral;
  await noble.stopScanningAsync();
  await peripheral.connectAsync();

  // Discover service 'ffe0' and characteristic 'ffe1'
  peripheral.discoverSomeServicesAndCharacteristics(
    ['ffe0'],
    ['ffe1'],
    (error, services, characteristics) => {
      if (error) {
        console.error('Error discovering services/characteristics:', error);
        return;
      }
      if (characteristics.length === 0) {
        console.error('Characteristic ffe1 not found.');
        return;
      }
      // Save the discovered characteristic to the global variable "hm10"
      global.hm10 = characteristics[0];
      console.log('Discovered characteristic ffe1 (hm10):', global.hm10.uuid);

      // Subscribe to notifications.
      global.hm10.subscribe((error) => {
        if (error) {
          console.error('Error subscribing to characteristic:', error);
        } else {
          console.log('Subscribed to characteristic notifications.');
        }
      });

      // Load the connected page and start listening.
      mainWindow.loadFile('connected.html').then(() => {
        require('./connected').startListening();
      });
    }
  );
}

app.whenReady().then(() => {
  createWindow();

  noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      console.log('Bluetooth is powered on, starting scan...');
      await noble.startScanningAsync([], true);
    } else {
      await noble.stopScanningAsync();
    }
  });

  ipcMain.on('start-connection', async () => {
    console.log('Start connection requested.');
  
    noble.on('discover', async (peripheral) => {
      console.log('Discovered peripheral:', peripheral.id);
  
      // Check if this peripheral is already in the global list.
      const existing = global.peripheralList.find(p => p.id === peripheral.id);
      if (!existing) {
        global.peripheralList.push(peripheral);
        console.log(`Added peripheral ${peripheral.id} to the list.`);
      } else {
        console.log(`Peripheral ${peripheral.id} is already in the list.`);
      }
  
      // Check if the target peripheral is in the list.
      checkForTarget();
    });

    checkForTarget();
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
        mainWindow.loadFile('index.html');
      } catch (err) {
        console.error('Error disconnecting peripheral:', err);
      }
    } else {
      console.log('No peripheral connected to disconnect.');
      await noble.stopScanningAsync();
      mainWindow.loadFile('index.html');
    }
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

  app.on('window-all-closed', () => {
    app.quit();
  });
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