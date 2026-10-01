const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('octopus', {
  request(method, params = {}) {
    return ipcRenderer.invoke('backend:request', method, params);
  },
  platform: process.platform,
});

