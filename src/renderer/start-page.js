// Ensure nodeIntegration is enabled (or use a preload script)
const { ipcRenderer } = require('electron');

// Wait for the DOM to be fully loaded before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('connectBtn');

  btn.addEventListener('click', () => {
    // Disable the button and update its text
    btn.disabled = true;
    btn.innerText = 'CONNECTING';
    
    // Send a message to the main process to start connecting
    ipcRenderer.send('start-connection');
  });

  // Listen for a response from the main process
  ipcRenderer.on('connection-success', () => {
    btn.innerText = 'CONNECTED';
    btn.style.backgroundColor = 'green';
  });

  ipcRenderer.on('connection-failed', () => {
    btn.innerText = 'CONNECT';
    btn.disabled = false;
  });
});