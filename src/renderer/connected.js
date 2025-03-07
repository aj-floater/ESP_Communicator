document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById('toggleButton');
  const disconnectBtn = document.getElementById('disconnectBtn')
  let isOn = false;

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
});
