const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // BLE read event
  onCharacteristicRead: (callback) => {
    ipcRenderer.on('characteristic-read', callback);
  },
  // BLE connect/disconnect
  startConnection: () => ipcRenderer.send('start-connection'),
  disconnectPeripheral: () => ipcRenderer.send('disconnect-peripheral'),
  // Persistence
  loadValues: () => ipcRenderer.invoke('load-values'),
  saveValues: (items) => ipcRenderer.send('save-values', items),
  // Write
  writeData: (data) => ipcRenderer.send('write-data', data),
});