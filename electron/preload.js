const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Store (persistent settings)
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),

  // Downloads
  downloadVideo: (data) => ipcRenderer.invoke('download-video', data),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  addDownload: (download) => ipcRenderer.invoke('add-download', download),

  // Notifications
  showNotification: (data) => ipcRenderer.invoke('show-notification', data),

  // App paths
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Navigation listener (from menu)
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, route) => callback(route));
  },

  // Media key events
  onMediaAction: (callback) => {
    ipcRenderer.on('media-action', (event, action) => callback(action));
  },

  // Update events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },

  // Auto-launch
  onAutoLaunch: (callback) => {
    ipcRenderer.on('auto-launch', () => callback());
  },
});
