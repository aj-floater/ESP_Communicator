const { ipcRenderer } = require('electron');

// Wait for the DOM to be fully loaded before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('connectBtn');

  btn.addEventListener('click', () => {
    // Disable the button and update its text
    btn.disabled = true;
    btn.innerText = 'CONNECTING';
    
    // Send a message to the main process to start connecting
    ipcMain.send('start-connection');
  });
});