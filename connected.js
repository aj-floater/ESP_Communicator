module.exports.startListening = () => {
  if (!global.hm10) {
    console.error('hm10 characteristic not found.');
    return;
  }

  // Function to decode data safely
  const decodeData = (dataStr) => {
    try {
      return dataStr.split(',').map(item => parseFloat(item));
    } catch (err) {
      console.error('Error parsing float array:', err);
      return [];
    }
  };

  global.hm10.on('data', (data, isNotification) => {
    try {
      if (!data) {
        throw new Error('Received empty data buffer.');
      }

      // Convert buffer to UTF-8 string
      const utf8Data = data.toString('utf8').trim(); // Trim to remove accidental whitespace

      // Decode data
      const floatArray = decodeData(utf8Data);

      console.log('Received Data:', utf8Data);
      console.log('Decoded Float Array:', floatArray);

      // Send to renderer
      if (global.mainWindow) {
        global.mainWindow.webContents.send('characteristic-read', utf8Data, floatArray);
      } else {
        console.error('mainWindow not available');
      }

    } catch (err) {
      console.error('Error processing characteristic data:', err);
    }
  });
};