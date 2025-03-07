const noble = require("@abandonware/noble");

const TARGET_PERIPHERAL_ID = '00714d08a544acaa4df2c5fc84c060ed';

async function initializeBluetooth() {
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

  noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      console.log('Bluetooth is powered on, starting scan...');
      await noble.startScanningAsync([], true);
    } else {
      await noble.stopScanningAsync();
    }
  });
}

// Global array to store discovered peripherals.
global.peripheralList = [];
// A flag to prevent duplicate processing of the target peripheral.
global.foundTargetCalled = false;
// Helper function to search through global.peripheralList
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
        startListening();
      });
    }
  );
}

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

function startListening() {
  if (!global.hm10) {
    console.error('hm10 characteristic not found.');
    return;
  }

  // Function to decode data safely from a UTF-8 string into an array of floats
  const decodeData = (dataStr) => {
    try {
      return dataStr.split(',').map(item => parseFloat(item));
    } catch (err) {
      console.error('Error parsing float array:', err);
      return [];
    }
  };

  global.hm10.on('data', (data, isNotification) => {
    try {
      if (!data) {
        throw new Error('Received empty data buffer.');
      }

      // Convert buffer to UTF-8 string and trim whitespace
      const utf8Data = data.toString('utf8').trim();

      // Decode the string into an array of floats
      const floatArray = decodeData(utf8Data);
      // console.log('Received Data:', utf8Data);
      // console.log('Decoded Float Array:', floatArray);

      // Build an array of objects, pairing each float with a name
      const values = [];
      const valueNames = ['Left Potentiometer', 'Right Potentiometer'];
      for (let i = 0; i < floatArray.length && i < valueNames.length; i++) {
        values.push({
          name: valueNames[i],
          value: floatArray[i]
        });
      }

      // Send the original data, the float array, and the value structure to the renderer
      if (global.mainWindow) {
        global.mainWindow.webContents.send('characteristic-read', utf8Data, floatArray, valueStruct);
      } else {
        console.error('mainWindow not available');
      }
    } catch (err) {
      console.error('Error processing characteristic data:', err);
    }
  });
};

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

module.exports = { initializeBluetooth, writeHM10 };