class StadiaController {
  constructor() {
    // Current state of buttons and joysticks
    this.state = {
      // Example named buttons (customize these based on your mapping)
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      x: false,
      y: false,
      leftShoulder: false,
      rightShoulder: false,
      leftTrigger: 0,   // triggers might be analog 0–255
      rightTrigger: 0,
      
      // Joysticks might be 0–255 for X/Y. 
      // We'll store them as objects so we can expand easily
      leftStick:  { x: 128, y: 128 }, 
      rightStick: { x: 128, y: 128 }
    };

    // Callback to fire when a new report arrives
    this.onStateChange = null;
  }

  /**
   * Sets a callback that is invoked whenever new data arrives.
   * callback(newState) => void
   */
  setOnStateChange(callback) {
    this.onStateChange = callback;
  }

  /**
   * Called whenever the controller receives a data report from node-hid.
   * @param {Buffer} data
   */
  handleData(data) {
    // Parse the raw bytes into state
    this.parseReport(data);

    // Fire callback if set
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.state);
    }
  }

  /**
   * Parse the Buffer from the HID report and update this.state accordingly.
   * (Customize the offsets/bitmasks based on your actual device.)
   */
  parseReport(data) {
    // For demonstration, we'll name the bytes b0, b1, ... b9
    // You have 11 bytes in your raw example
    const b0 = data[0];
    const b1 = data[1];
    const b2 = data[2];
    const b3 = data[3];
    const b4 = data[4];
    const b5 = data[5];
    const b6 = data[6];
    const b7 = data[7];
    const b8 = data[8];
    const b9 = data[9];
    const b10 = data[10];

    // Example usage: b3 might hold a combination of bits for face buttons
    // Each bit or combination indicates a pressed button.
    // We'll define a helper:
    const bitSet = (byte, mask) => ((byte & mask) !== 0);

    // Suppose b3 bits are:
    //   1 => A
    //   2 => B
    //   4 => X
    //   8 => Y
    //   16 => Left Shoulder
    //   32 => Right Shoulder
    // This is purely illustrative:
    this.state.a = bitSet(b3, 64);
    this.state.b = bitSet(b3, 32);
    this.state.x = bitSet(b3, 16);
    this.state.y = bitSet(b3, 8);
    this.state.leftShoulder  = bitSet(b3, 4);
    this.state.rightShoulder = bitSet(b3, 2);

    // Perhaps b1 has bits for D-pad
    //   1 => Up
    //   2 => Down
    //   4 => Left
    //   8 => Right
    this.state.up    = bitSet(b1, 0);
    this.state.right = bitSet(b1, 2);
    this.state.down  = bitSet(b1, 4);
    this.state.left  = bitSet(b1, 6);

    // Maybe triggers are in b8 and b9 with 0–255 range
    this.state.leftTrigger  = b8;  // range 0–255
    this.state.rightTrigger = b9;  // range 0–255

    // Suppose left joystick is in b4 and b5, right joystick in b6 and b7
    // each 0–255, with 128 = center
    this.state.leftStick.x  = b4; 
    this.state.leftStick.y  = b5; 
    this.state.rightStick.x = b6;
    this.state.rightStick.y = b7;

    // Do any additional logic or parsing for other bits/bytes
  }
}

module.exports = StadiaController;