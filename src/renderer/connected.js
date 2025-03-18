const { ipcRenderer } = require('electron');

const toggleButton = document.getElementById('toggleButton');
const disconnectBtn = document.getElementById('disconnectBtn')
let isOn = false;

// leftValues and rightValues store the current readings for the left and right wheels.
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
ipcRenderer.on('characteristic-read', (event, originalData, values) => {
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



function adjustCharts() {
  const chartSection = document.querySelector('.chart-section');
  const wrappers = chartSection.querySelectorAll('.chart-wrapper');
  const totalCharts = wrappers.length;
  
  // Calculate the number of rows based on having a maximum of 2 charts per row.
  const rows = Math.ceil(totalCharts / 2);
  
  // Calculate available container dimensions.
  const containerHeight = chartSection.clientHeight - 30; // Adjust if needed for padding/margins.
  const containerWidth = chartSection.clientWidth;
  
  // Determine each row's height.
  const rowHeight = containerHeight / rows;
  
  // Set width: if there's only one chart, let it fill the container; otherwise, half the container's width.
  const chartWidth = totalCharts === 1 ? containerWidth : containerWidth / 2;
  
  wrappers.forEach(wrapper => {
    wrapper.style.height = rowHeight + 'px';
    wrapper.style.width = chartWidth + 'px';
  });
}

// Run on initial load and on window resize.
window.addEventListener('DOMContentLoaded', adjustCharts);
window.addEventListener('resize', adjustCharts);






document.addEventListener('DOMContentLoaded', function() {
  const valuesContainer = document.getElementById('valuesContainer');
  const addValueBtn = document.getElementById('addValueBtn');

  // Function to create a new value item element with a container for the inputs
  function createValueItem(name = 'Value Name', value = '0') {
    const valueItem = document.createElement('div');
    valueItem.className = 'value-item';

    // Create a container for the name and value inputs so they can stack vertically.
    const valueFields = document.createElement('div');
    valueFields.className = 'value-fields';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'value-name';
    nameInput.value = name;

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'value-input';
    valueInput.value = value;

    // Append the inputs to the valueFields container.
    valueFields.appendChild(nameInput);
    valueFields.appendChild(valueInput);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'x';

    // Remove the value item when the delete button is clicked.
    deleteBtn.addEventListener('click', function() {
      valuesContainer.removeChild(valueItem);
    });

    // Append the valueFields container and then the delete button to the main value item.
    valueItem.appendChild(valueFields);
    valueItem.appendChild(deleteBtn);

    return valueItem;
  }

  // Add a new value item when the '+' button is clicked.
  addValueBtn.addEventListener('click', function() {
    const newValueItem = createValueItem();
    valuesContainer.appendChild(newValueItem);
    // Optionally, scroll to the bottom to show the new element.
    valuesContainer.scrollTop = valuesContainer.scrollHeight;
  });

  // How often to transmit (ms)
  const SEND_INTERVAL_MS = 100;

  setInterval(() => {
    // Get all value items in the values container.
    const valueItems = document.querySelectorAll('#valuesContainer .value-item');
    const valuesArr = [];

    // Loop over each value item and retrieve its value from the 'value-input' field.
    valueItems.forEach(item => {
      const valueInput = item.querySelector('.value-input');
      if (valueInput) {
        // Trim whitespace and push the value into the array.
        valuesArr.push(valueInput.value.trim());
      }
    });

    // Construct the data string with a start '<' and an end '>' marker.
    const dataString = `<<${valuesArr.join(',')}>\0`;

    document.getElementById('writeOutput').innerText = dataString;

    // Send a message to the main process to write data
    ipcRenderer.send('write-data', dataString);
  }, SEND_INTERVAL_MS);
});