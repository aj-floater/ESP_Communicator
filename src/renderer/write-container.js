function addValueItem(initialName = 'Value Name', initialValue = '0') {
  const newValueItem = document.createElement('div');
  newValueItem.classList.add('value-item');

  const valueFields = document.createElement('div');
  valueFields.classList.add('value-fields');

  const inputName = document.createElement('input');
  inputName.type = 'text';
  inputName.classList.add('value-name');
  inputName.value = initialName;

  const inputValue = document.createElement('input');
  inputValue.type = 'text';
  inputValue.classList.add('value-input');
  inputValue.value = initialValue;

  valueFields.append(inputName, inputValue);
  newValueItem.append(valueFields);

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = 'x';
  deleteBtn.addEventListener('click', () => newValueItem.remove());
  newValueItem.append(deleteBtn);

  const addValueBtn = document.getElementById('addValueBtn');
  addValueBtn.parentNode.insertBefore(newValueItem, addValueBtn);
}

dataString = '';

function getCurrentValueItems() {
  return Array.from(
    document.querySelectorAll('.values-panel .value-item')
  ).map(item => ({
    name:  item.querySelector('.value-name').value.trim(),
    value: item.querySelector('.value-input').value.trim()
  }));
}

function updateWriteOutput() {
  const vals = getCurrentValueItems().map(x => x.value);
  dataString = `<${vals.join(',')}>\0`;
  document.getElementById('writeOutput').innerText = dataString;
}

// anywhere at top of file
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function writeValues() {
  // 1) Enter ChangeValue state
  window.electronAPI.writeData('V');
  await pause(200);

  // 2) Send every current name/value pair
  const items = getCurrentValueItems();
  for (const { name, value } of items) {
    window.electronAPI.writeData(name + ':' + value);
    await pause(200);
  }

  // // 3) Return to Idle state
  // window.electronAPI.writeData('I');
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Load saved items from disk
  const savedItems = await window.electronAPI.loadValues();
  if (Array.isArray(savedItems) && savedItems.length) {
    savedItems.forEach(item =>
      addValueItem(item.name, item.value)
    );
  }

  // Attach the addValueItem function to the click event of the add-value button
  document.getElementById('addValueBtn').addEventListener('click', addValueItem);
  
  // Attach the writeValues function to the click event of the write button
  document.getElementById('writeBtn').addEventListener('click', writeValues);

  const SEND_INTERVAL_MS = 100;
  // How often to updateWriteOutput (ms)
  setInterval(() => {
    updateWriteOutput();
    const currentItems = getCurrentValueItems();
    window.electronAPI.saveValues(currentItems);
  }, SEND_INTERVAL_MS);
});