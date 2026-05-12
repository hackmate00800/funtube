const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, Notification, globalShortcut, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    theme: 'dark',
    windowBounds: { width: 1280, height: 720 },
    downloads: [],
    settings: {
      autoLaunch: false,
      minimizeToTray: true,
      notificationsEnabled: true,
      downloadLocation: app.getPath('downloads'),
    },
  },
});

let mainWindow;
let tray = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const { width, height } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    title: 'FunTube',
    icon: path.join(__dirname, '../client/public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false,
      spellcheck: true,
    },
    frame: true,
    backgroundColor: '#0a0a14',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (store.get('settings.autoLaunch')) {
      mainWindow.webContents.send('auto-launch');
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting && store.get('settings.minimizeToTray')) {
      e.preventDefault();
      mainWindow.hide();
      return;
    }
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupMenu();
  setupIPC();
  setupShortcuts();
}

function setupMenu() {
  const template = [
    {
      label: 'FunTube',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('navigate', '/'),
        },
        {
          label: 'Trending',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('navigate', '/trending'),
        },
        {
          label: 'Subscriptions',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('navigate', '/subscriptions'),
        },
        { type: 'separator' },
        {
          label: 'Upload',
          accelerator: 'CmdOrCtrl+u',
          click: () => mainWindow?.webContents.send('navigate', '/upload'),
        },
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+d',
          click: () => mainWindow?.webContents.send('navigate', '/dashboard'),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About FunTube',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About FunTube',
              message: 'FunTube v1.0.0',
              detail: 'A modern video streaming desktop application built with Electron, React, and Node.js.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupTray() {
  if (tray) return;

  try {
    const iconPath = path.join(__dirname, 'tray-icon.png');
    const fallbackIcon = path.join(__dirname, '../client/public/icon.png');
    const finalIcon = require('fs').existsSync(iconPath) ? iconPath : fallbackIcon;
    if (!require('fs').existsSync(finalIcon)) return;
    tray = new Tray(finalIcon);
    tray.setToolTip('FunTube');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open FunTube',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Upload Video',
      click: () => {
        mainWindow?.webContents.send('navigate', '/upload');
        mainWindow?.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('Tray setup failed:', err.message);
  }
}

function setupShortcuts() {
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('media-action', 'play-pause');
  });

  globalShortcut.register('MediaNextTrack', () => {
    mainWindow?.webContents.send('media-action', 'next');
  });

  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow?.webContents.send('media-action', 'previous');
  });
}

function setupIPC() {
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      ...options,
    });
    return result;
  });

  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('get-store', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-store', (event, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('download-video', async (event, { url, filename }) => {
    const downloadPath = store.get('settings.downloadLocation') || app.getPath('downloads');
    const fullPath = path.join(downloadPath, filename);

    mainWindow.webContents.downloadURL(url);

    return fullPath;
  });

  ipcMain.handle('get-downloads', () => {
    return store.get('downloads', []);
  });

  ipcMain.handle('add-download', (event, download) => {
    const downloads = store.get('downloads', []);
    downloads.unshift({ ...download, timestamp: Date.now() });
    store.set('downloads', downloads.slice(0, 50));
    return downloads;
  });

  ipcMain.handle('show-notification', (event, { title, body, icon }) => {
    if (!store.get('settings.notificationsEnabled')) return;

    const notifIcon = icon || path.join(__dirname, '../client/public/icon.png');
    const notification = new Notification({ title, body, icon: notifIcon });
    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notification.show();
  });

  ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
  });
}

app.whenReady().then(() => {
  createWindow();

  if (process.platform === 'win32' || process.platform === 'darwin') {
    setupTray();
  }

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-progress', progress);
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version has been downloaded. Restart to apply the update?',
      buttons: ['Restart', 'Later'],
    })
    .then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
});
