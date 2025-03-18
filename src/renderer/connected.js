const { ipcRenderer } = require('electron');

const toggleButton = document.getElementById('toggleButton');
const disconnectBtn = document.getElementById('disconnectBtn')
let isOn = false;

leftValues = [
  { name: 'Left Wheel Speed', value: 0 },
  { name: 'Left Wheel Desired Speed', value: 0 }
];
rightValues = [
  { name: 'Right Wheel Speed', value: 0 },
  { name: 'Right Wheel Desired Speed', value: 0 }
];

function updateValues(targetArray, values, startIndex, endIndex) {
  for (let i = 0; i < targetArray.length && startIndex + i < endIndex && startIndex + i < values.length; i++) {
    targetArray[i].value = values[startIndex + i].value;
  }
}

// Update output when new characteristic data is received.
ipcRenderer.on('characteristic-read', (event, originalData, values) => {
  // Update textual output.
  let output = ``;
  values.forEach(item => {
    output += `${item.name}: ${item.value}\n`;
  });
  document.getElementById('dataOutput').innerText = output;

  // Update leftValues and rightValues
  updateValues(leftValues, values, 0, leftValues.length);
  updateValues(rightValues, values, leftValues.length, leftValues.length + rightValues.length);
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
