const path = require('path');
const { BrowserWindow } = require("electron");

let mainWindow;

// Function to create the Electron window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,      // ← must be true
      nodeIntegration: false,      // ← recommended off
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#16191d',
    trafficLightPosition: { x: 10, y: 10 }
  });
  global.mainWindow = mainWindow; // Make mainWindow global for use in connected.js
  mainWindow.loadFile('src/views/ble-communicator.html');
}

module.exports = { createMainWindow, mainWindow };