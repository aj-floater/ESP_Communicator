const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const noble = require('@abandonware/noble');
const chart = require('chart.js');

const HID = require('node-hid');
const StadiaController = require('./stadiacontroller.js');

// Usage:
const vendorId = 6353;
const productId = 37888;

// const device = new HID.HID(vendorId, productId); // Just an example
const controller = new StadiaController();

function writeHM10(dataToSend) {
  if (global.hm10) {
    // Convert the data to a Buffer (assuming UTF-8 text)
    const buffer = Buffer.from(dataToSend, 'utf8');
    
    // Write the buffer to the BLE characteristic
    global.hm10.write(buffer, true, (err) => {
      if (err) {
        console.error('Error writing data to global.hm10:', err);
      } else {
        console.log('Data successfully written to global.hm10:', dataToSend);
      }
    });
  } else {
    console.error('global.hm10 is not available.');
  }
}

function openDeviceAsync(vid, pid) {
  return new Promise((resolve, reject) => {
    try {
      const device = new HID.HID(vid, pid);
      resolve(device);
    } catch (err) {
      reject(err);
    }
  });
}

async function openAndListen(vid, pid) {
  try {
    const device = await openDeviceAsync(vid, pid);
    console.log(`Device opened for VID:${vid} PID:${pid}`);

    // We'll store the most recent values and when they arrived.
    let lastDataTime = 0;
    let leftY = 0.0;
    let rightX = 0.0;

    // How often to transmit (ms)
    const SEND_INTERVAL_MS = 100;

    // When new data arrives from the device, just update lastDataTime and stick values.
    device.on('data', (data) => {
      lastDataTime = Date.now();
      controller.handleData(data);
      leftY = controller.state.leftStick.y;
      rightX = controller.state.rightStick.x;
    });

    // If there's an error
    device.on('error', (err) => {
      console.error('Error from device:', err);
    });

    // Use a timer to send data every SEND_INTERVAL_MS, whether new data arrived or not.
    setInterval(() => {
      const now = Date.now();

      // How long since device last gave us data?
      const elapsed = now - lastDataTime;

      if (elapsed >= SEND_INTERVAL_MS) {
        // No fresh data arrived since the last interval -> send 128.0
        writeHM10('128.0,128.0\0');
      } else {
        // We have fresh data -> send the stored joystick values
        const dataString = `${leftY},${rightX}\0`;
        writeHM10(dataString);
      }
    }, SEND_INTERVAL_MS);

  } catch (err) {
    console.error('Error opening device:', err);
  }
}

let mainWindow;
const TARGET_PERIPHERAL_ID = '00714d08a544acaa4df2c5fc84c060ed';

// Global array to store discovered peripherals.
global.peripheralList = [];
// A flag to prevent duplicate processing of the target peripheral.
global.foundTargetCalled = false;

// Function to create the Electron window
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

  openAndListen(vendorId, productId);

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