const noble = require("@abandonware/noble");
const { ipcMain, ipcRenderer } = require("electron");

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
      // console.log(`Peripheral ${peripheral.id} is already in the list.`);
    }
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
      mainWindow.loadFile('src/views/connected.html').then(() => {
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

values = [
  { name: 'Left Wheel Speed', value: 0 },
  { name: 'Left Wheel Desired Speed', value: 0 },
  { name: 'Right Wheel Speed', value: 0 },
  { name: 'Right Wheel Desired Speed', value: 0 }
];

function startListening() {
  if (!global.hm10) {
    console.error('hm10 characteristic not found.');
    return;
  }

  // Global variables to track the ongoing read buffer and cycle count.
  let readBuffer = "";
  let cycleCount = 0;
  const MAX_CYCLES = 4;

  // Function to decode data safely from a UTF-8 string into an array of floats.
  const decodeData = (dataStr) => {
    try {
      return dataStr.split(',').map(item => parseFloat(item));
    } catch (err) {
      console.error('Error parsing float array:', err);
      return [];
    }
  };

  global.mainWindow.webContents.send('characteristic-read', null, values);

  global.hm10.on('data', (data, isNotification) => {
    try {
      if (!data) {
        throw new Error('Received empty data buffer.');
      }
      
      // Convert the incoming buffer to a UTF-8 string.
      // We do not trim here as whitespace may be part of incomplete messages.
      const utf8Data = data.toString('utf8');
      
      // If the new data contains a start marker '<', reset the readBuffer.
      if (utf8Data.includes('<')) {
        const startIndex = utf8Data.indexOf('<');
        // Start a new readBuffer beginning with this marker.
        readBuffer = utf8Data.substring(startIndex);
        cycleCount = 0;
      } else if (readBuffer.length > 0) {
        // If already in the middle of reading a message, append the new data.
        readBuffer += utf8Data;
      } else {
        // If no active message (no '<' found yet), ignore this data.
        return;
      }
      
      // Check if the readBuffer now contains the end marker '>'.
      if (readBuffer.includes('>')) {
        // Find the first occurrence of the end marker.
        const endIndex = readBuffer.indexOf('>');
        // Extract the message between the markers, excluding the '<' and '>'.
        const message = readBuffer.substring(1, endIndex);
        
        // Decode the comma-separated float values.
        const floatArray = decodeData(message);
        console.log('Received Data:', message);
        
        for (let i = 0; i < floatArray.length && i < values.length; i++) {
          values[i].value = floatArray[i];
        }
        
        // Send the complete data to the mainWindow.
        if (global.mainWindow) {
          global.mainWindow.webContents.send('characteristic-read', message, values);
        } else {
          console.error('mainWindow not available');
        }
        
        // Clear the readBuffer and reset cycle counter after a successful read.
        readBuffer = "";
        cycleCount = 0;
      } else {
        // No end marker yet. Increment the cycle count.
        cycleCount++;
        
        // If the end marker hasn't arrived after MAX_CYCLES, clear the buffer.
        if (cycleCount >= MAX_CYCLES) {
          console.warn('End marker not found within 4 read cycles; clearing buffer.');
          readBuffer = "";
          cycleCount = 0;
        }
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

module.exports = { initializeBluetooth, writeHM10, values };