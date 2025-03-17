const { BrowserWindow } = require("electron");

let mainWindow;

// Function to create the Electron window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#16191d',
    trafficLightPosition: { x: 10, y: 10 }
  });
  global.mainWindow = mainWindow; // Make mainWindow global for use in connected.js
  mainWindow.loadFile('src/views/start-page.html');
}

module.exports = { createMainWindow, mainWindow };