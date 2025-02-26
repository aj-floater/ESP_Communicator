const { app, BrowserWindow, ipcMain } = require('electron');
const noble = require('@abandonware/noble');

let mainWindow;
const TARGET_PERIPHERAL_ID = '00714d08a544acaa4df2c5fc84c060ed';

// Declare a global variable to store the characteristic (hm10)
global.hm10 = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  global.mainWindow = mainWindow;  // Make mainWindow global for use in connected.js
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('start-connection', async () => {
    console.log('Start connection requested.');

    // Start scanning once the adapter is powered on.
    noble.on('stateChange', async (state) => {
      if (state === 'poweredOn') {
        console.log('Bluetooth is powered on, starting scan...');
        await noble.startScanningAsync([], false);
      }
    });

    noble.on('discover', async (peripheral) => {
      console.log('Discovered peripheral:', peripheral.id);
      if (peripheral.id === TARGET_PERIPHERAL_ID) {
        console.log('Found target peripheral:', peripheral.id);
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
            
            // Subscribe to notifications if needed
            global.hm10.subscribe((error) => {
              if (error) {
                console.error('Error subscribing to characteristic:', error);
              } else {
                console.log('Subscribed to characteristic notifications.');
              }
            });

            // Then load the connected page and start listening:
            mainWindow.loadFile('connected.html').then(() => {
              // Start listening for data events on the global hm10.
              require('./connected').startListening();
            });
          }
        );
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
});