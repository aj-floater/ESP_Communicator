// leftValues and rightValues store the current readings for the left and right wheels.

/**
 * initJoystickControls
 * 
 * @param {Object}   options
 * @param {string}   options.controllerState      — the data-state code for your “controller” mode (e.g. 'L' or 'C')
 * @param {string}   options.stateButtonsSelector — CSS selector for your state buttons (e.g. '.state-btn')
 * @param {Function} options.sendData             — function to call when you want to send a packet over BLE
 * @returns {Object} cleanup API: { destroy() }
 */
function initJoystickControls({
  controllerState      = 'L',
  stateButtonsSelector = '.state-btn',
  sendData
}) {
  let activeState = null;
  const joystick = { up:0, down:0, left:0, right:0 };
  const stateButtons = document.querySelectorAll(stateButtonsSelector);

  // --- highlight + track which state is active ---
  function setActive(btn) {
    stateButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeState = btn.dataset.state;
  }

  // wire up your state buttons to send the single-char state and mark active
  stateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const st = btn.dataset.state;
      sendData(st);
      setActive(btn);
    });
    // grab any pre-existing .active
    if (btn.classList.contains('active')) {
      activeState = btn.dataset.state;
    }
  });

  // --- helper to emit the joystick packet ---
  function sendJoystick() {
    const { up, down, left, right } = joystick;
    sendData(`<<${up},${down},${left},${right}>`);
  }

  // --- keyboard handlers ---
  function onKeyDown(e) {
    if (activeState !== controllerState) return;
    let changed = false;
    switch (e.key.toLowerCase()) {
      case 'w': if (!joystick.up)    { joystick.up    = 1; changed = true; } break;
      case 's': if (!joystick.down)  { joystick.down  = 1; changed = true; } break;
      case 'a': if (!joystick.left)  { joystick.left  = 1; changed = true; } break;
      case 'd': if (!joystick.right) { joystick.right = 1; changed = true; } break;
    }
    if (changed) sendJoystick();
  }

  function onKeyUp(e) {
    if (activeState !== controllerState) return;
    let changed = false;
    switch (e.key.toLowerCase()) {
      case 'w': if (joystick.up)    { joystick.up    = 0; changed = true; } break;
      case 's': if (joystick.down)  { joystick.down  = 0; changed = true; } break;
      case 'a': if (joystick.left)  { joystick.left  = 0; changed = true; } break;
      case 'd': if (joystick.right) { joystick.right = 0; changed = true; } break;
    }
    if (changed) sendJoystick();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);

  // Return a cleanup handle in case you ever want to unbind it
  return {
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    }
  };
}

// Their names are static, but the values will be updated as new data is received.
leftValues = [
  { name: 'Left Wheel Speed', value: 0 },
  { name: 'Left Wheel Desired Speed', value: 0 }
];
rightValues = [
  { name: 'Right Wheel Speed', value: 0 },
  { name: 'Right Wheel Desired Speed', value: 0 }
];

/**
 * updateValues - Updates a target array of value objects using a subset of a larger values array.
 *
 * @param {Array} targetArray - The array to be updated (e.g., leftValues or rightValues).
 * @param {Array} values - The larger array of value objects received from the data source.
 * @param {number} startIndex - The starting index in the values array to copy data from.
 * @param {number} endIndex - The end index (non-inclusive) in the values array that defines the range of values to copy.
 *
 * This function loops over the targetArray and for each element it assigns the corresponding
 * value from the values array (starting at startIndex). It stops when it reaches the targetArray's
 * length, the endIndex limit, or the end of the values array.
 */
function updateValues(targetArray, values, startIndex, endIndex) {
  for (let i = 0; i < targetArray.length && startIndex + i < endIndex && startIndex + i < values.length; i++) {
    targetArray[i].value = values[startIndex + i].value;
  }
}

/**
 * Characteristic Read Event Handler
 *
 * This event listener is triggered whenever new characteristic data is received.
 * In this context, it comes from the Bluetooth.
 *
 * Inside the handler:
 * 1. It builds a textual output string from the entire `values` array to display the updated readings.
 * 2. It updates the DOM element with id 'readOutput' so the user sees the latest data.
 * 3. It calls the updateValues function to update leftValues and rightValues:
 *    - The first two elements of values are used to update leftValues.
 *    - The next two elements are used to update rightValues.
 *
 * Additionally, these updated leftValues and rightValues are used elsewhere (e.g., in chart.js)
 * to refresh the displayed charts with the new data.
 */
window.electronAPI.onCharacteristicRead((event, originalData, values) => {
  // Build a string of data for display.
  let output = ``;
  values.forEach(item => {
    output += `${item.name}: ${item.value}\n`;
  });
  document.getElementById('readOutput').innerText = output;

  // Update leftValues and rightValues using the new values:
  // - For leftValues, update using the first two elements from values.
  // - For rightValues, update using the next two elements from values.
  updateValues(leftValues, values, 0, leftValues.length);
  updateValues(rightValues, values, leftValues.length, leftValues.length + rightValues.length);
});

connectBtn, disconnectBtn;

function handleDisconnectClick(event) {
  connectBtn.disabled = false;
  connectBtn.innerText = "connect";

  window.electronAPI.disconnectPeripheral();
}

// rename handler so it doesn’t clash with the button variable
function handleConnectClick(event) {
  // `event.currentTarget` is the button that was clicked
  const btn = event.currentTarget;
  btn.disabled = true;
  btn.innerText = 'connecting...';

  // use ipcRenderer in the renderer process
  window.electronAPI.startConnection();
}

document.addEventListener("DOMContentLoaded", () => {
  const joystick = initJoystickControls({
    controllerState:      'C',                           // or 'C' if that’s your code
    stateButtonsSelector: '.state-btn',
    sendData:             d => window.electronAPI.writeData(d)
  });

  connectBtn    = document.getElementById('connectBtn');
  disconnectBtn = document.getElementById('disconnectBtn');

  connectBtn.addEventListener('click', handleConnectClick);
  disconnectBtn.addEventListener('click', handleDisconnectClick);

  // Grab all the state-buttons
  const stateButtons = document.querySelectorAll('.state-btn');

  // Helper to clear “active” and set the clicked button
  function setActive(button) {
    stateButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
  }

  // Wire up each button
  stateButtons.forEach(btn => {
    btn.addEventListener('mouseup', () => {
      const stateChar = btn.dataset.state;       // 'T', 'L', 'V' or 'I'
      window.electronAPI.writeData(`${stateChar}`);   // send single‐byte state to MCU
      setActive(btn);
    });
  });
});
