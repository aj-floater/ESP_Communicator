const { app, BrowserWindow, ipcMain } = require('electron');
const noble = require('@abandonware/noble');

let mainWindow;
const TARGET_PERIPHERAL_ID = '00714d08a544acaa4df2c5fc84c060ed';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,      // enable if needed
      contextIsolation: false     // disable if using nodeIntegration
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // Listen for the "start-connection" message from the renderer
  ipcMain.on('start-connection', async () => {
    console.log('Start connection requested.');

    // Ensure that Noble starts scanning once the Bluetooth adapter is powered on
    noble.on('stateChange', async (state) => {
      if (state === 'poweredOn') {
        console.log('Bluetooth is powered on, starting scan...');
        await noble.startScanningAsync([], false);
      }
    });

    // Discover peripherals
    noble.on('discover', async (peripheral) => {
      console.log('Discovered peripheral:', peripheral.id);
      if (peripheral.id === TARGET_PERIPHERAL_ID) {
        console.log('Found target peripheral:', peripheral.id);
        await noble.stopScanningAsync();
        await peripheral.connectAsync();

        // Discover the service 'ffe0' and characteristic 'ffe1'
        peripheral.discoverSomeServicesAndCharacteristics(
          ['ffe0'], // Service UUIDs (as an array)
          ['ffe1'], // Characteristic UUIDs (as an array)
          (error, services, characteristics) => {
            if (error) {
              console.error('Error discovering services/characteristics:', error);
              return;
            }
            if (characteristics.length === 0) {
              console.error('Characteristic ffe1 not found.');
              return;
            }
            const characteristic = characteristics[0];
            const charInfo = {
              uuid: characteristic.uuid,
              properties: characteristic.properties // e.g., ['read', 'write', 'notify']
            };
            console.log('Discovered characteristic info:', charInfo);

            // Load the connected page and send the characteristic info via IPC
            mainWindow.loadFile('connected.html').then(() => {
              mainWindow.webContents.send('characteristic-info', charInfo);
            });
          }
        );
      }
    });
  });

  // Quit when all windows are closed (except on macOS)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
});
