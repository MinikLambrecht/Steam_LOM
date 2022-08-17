import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';


// Variables
let mainWindow: BrowserWindow | null = null;
const store = new Store();
const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// Setup App updater
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// IPC listeners
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});

ipcMain.on('electron-store-set', async (_event, key, val) => {
  store.set(key, val);
});

// If in production mode, add source map support.
if (process.env.NODE_ENV === 'production')
{
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

// Is in development mode, add electron debug support.
if (isDebug) require('electron-debug')();

// Force install the react dev tools to the electron app.
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer.default(
      extensions.map((name) => installer[name]),
      forceDownload
    ).catch(console.log);
};

// Create a new browser window.
const createWindow = async () => {
  if (isDebug) await installExtensions();

  // Set the asset path, for production and development environments.
  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // Setup the browser window and configure it.
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    width: 1280,
    height: 720,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  // Load the app.
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // Electron events.
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) throw new Error('"mainWindow" is not defined'); 

    if (process.env.START_MINIMIZED)
    {
      mainWindow.minimize();
    }
    else
    {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Build & initialize the menu.
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser.
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.whenReady().then(() => {
  createWindow();
}).catch(console.log);
