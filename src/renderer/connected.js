const { ipcRenderer } = require('electron');

const toggleButton = document.getElementById('toggleButton');
const disconnectBtn = document.getElementById('disconnectBtn')
let isOn = false;

// Global variables to hold the latest potentiometer values.
let floatArrayMain = null;

// Update output when new characteristic data is received.
ipcRenderer.on('characteristic-read', (event, originalData, floatArray, valueStruct) => {
  // Update textual output.
  let output = ``;
  valueStruct.forEach(item => {
    output += `${item.name}: ${item.value}\n`;
  });
  document.getElementById('dataOutput').innerText = output;
});

toggleButton.addEventListener('click', () => {
  if (isOn) {
    toggleButton.classList.remove('on');
    toggleButton.classList.add('off');
    ipcRenderer.send('write-data', "0");  // Send "0" when off
  } else {
    toggleButton.classList.remove('off');
    toggleButton.classList.add('on');
    ipcRenderer.send('write-data', "1");  // Send "1" when on
  }
  isOn = !isOn;
});

// Handle disconnect button
disconnectBtn.addEventListener('click', () => {
  ipcRenderer.send('disconnect-peripheral');
});

// Initialize button state
toggleButton.classList.add('off');
