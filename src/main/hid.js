const HID = require('node-hid');
const StadiaController = require('./stadiacontroller.js');

// const vendorId = 6353;
// const productId = 37888;

const controller = new StadiaController();

function openDeviceAsync(productId, productId) {
  return new Promise((resolve, reject) => {
    try {
      const device = new HID.HID(vendorId, productId);
      resolve(device);
    } catch (err) {
      reject(err);
    }
  });
}

async function startHIDListening() {
  try {
    const device = await openDeviceAsync(vendorId, productId);
    console.log(`Device opened for VID:${vendorId} PID:${productId}`);

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

module.exports = { startHIDListening };