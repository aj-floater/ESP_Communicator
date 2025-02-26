// connected.js
module.exports.startReading = (characteristic, mainWindow, interval = 1000) => {
  // Periodically read from the characteristic every interval ms.
  setInterval(() => {
    characteristic.read((error, data) => {
      if (error) {
        console.error('Error reading characteristic:', error);
        return;
      }
      // Convert the received data (Buffer) into a UTF-8 string.
      const utf8Data = data;
      mainWindow.webContents.send('characteristic-read', utf8Data);
    });
  }, interval);
};
