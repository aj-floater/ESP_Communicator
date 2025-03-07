module.exports.startListening = () => {
  if (!global.hm10) {
    console.error('hm10 characteristic not found.');
    return;
  }

  // Create an array of names for the values (adjust as needed)
  const valueNames = ['Left Potentiometer', 'Right Potentiometer'];

  // Function to decode data safely from a UTF-8 string into an array of floats
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

      // Convert buffer to UTF-8 string and trim whitespace
      const utf8Data = data.toString('utf8').trim();

      // Decode the string into an array of floats
      const floatArray = decodeData(utf8Data);
      // console.log('Received Data:', utf8Data);
      // console.log('Decoded Float Array:', floatArray);

      // Build an array of objects, pairing each float with a name
      const valueStruct = [];
      for (let i = 0; i < floatArray.length && i < valueNames.length; i++) {
        valueStruct.push({
          name: valueNames[i],
          value: floatArray[i]
        });
      }
      // console.log('Value Struct:', valueStruct);

      // Send the original data, the float array, and the value structure to the renderer
      if (global.mainWindow) {
        global.mainWindow.webContents.send('characteristic-read', utf8Data, floatArray, valueStruct);
      } else {
        console.error('mainWindow not available');
      }
    } catch (err) {
      console.error('Error processing characteristic data:', err);
    }
  });
};