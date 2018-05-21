import config from './config';
import { Service } from './ipc';
import ipcInit from './ipc';
const path = require('path');
const url = require('url');
const { app, BrowserWindow, Tray, Menu, dialog } = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

let win, tray;

function _installExtensions() {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));
  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));
}
function _createTray() {
  // CREATE TRAY ICON & CONTEXT MENU
  tray = new Tray(config.iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: function () {
        win.show();
      }
    },
    {
      label: 'Quit',
      click: function () {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => win.show());
}
function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 700,
    center: true,
    title: 'PushPrinter',
    resizable: true,
    icon: config.iconPath,
    enableLargerThanScreen: false,
    fullscreenable: false,
    maximizable: false,
  });

  _installExtensions();
  _createTray();

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  console.log(config.isProduction);
  if (!config.isProduction)
    win.webContents.openDevTools();

  win.on('show', function () {
    tray.setHighlightMode('always');
  });

  win.on('close', function (event) {
    // PREVENT APP FROM CLOSING ON EXIT BUTTON
    if(config.isProduction && !app.isQuiting){
      event.preventDefault();
      win.hide();
      tray.setHighlightMode('always');
    }
    else {
      Service.stop();
      setTimeout(() => {
        win = null;
      }, 200);
    }
    return false;
  });

  win.on('closed', () => {
    win = null
  });

  ipcInit(win);
}
function initWindow() {
  app.on('ready', () => createWindow());
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });
  app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
  });
}

function handleMultipleInstances() {
  const title = "PushPrinter Already Running";
  const body = "If you would like to run multiple copies of PushPrinter at once, please use a program such as https://www.sandboxie.com";
  dialog.showErrorBox(title, body);
  app.quit();
}
function restoreWindowOnMultipleInstances() {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.show();
    win.focus();
  }
}

export { initWindow, restoreWindowOnMultipleInstances, handleMultipleInstances }