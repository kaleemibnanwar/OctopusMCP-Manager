const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('octopus', {
  request(method, params = {}) {
    return ipcRenderer.invoke('backend:request', method, params);
  },
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
});
