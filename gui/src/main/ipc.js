import AppService from '../../../service/index';
import config from './config';
import storage from './storage';
const { app, ipcMain } = require('electron');
const Raven = require('raven');

const Service = new AppService({
  operating_system: "windows",
  path_save_folder: config.savePath,
  api_url_base_64: config.api_url_base_64,
  api_url_ably_auth: config.api_url_ably_auth,
});

export default (win) => {

  // token-error, auth-error, started, stopped
  Service.on("updates", data => {
    win.webContents.send("service:updates", data);
  });

  // ably statuses
  Service.on("updates_status", data => {
    win.webContents.send("service:updates:status", data);
  });

  Service.on("print_job", data => {
    win.webContents.send("service:updates:print-job", data);
  });

  Service.on("error", e => {
    console.log(e);
    Raven.captureException(e);
  });

  ipcMain.on("service:start", (event, base64) => {
    Service.start();
  });

  ipcMain.on("service:stop", (event, base64) => {
    Service.stop();
  });

  ipcMain.on("service:get-config", (event, opts={}) => {
    storage.get('config-v2')
      .then( data => {
        event.sender.send("service:get-config", { data });
      })
      .catch( err => {
        console.log(err);
        event.sender.send("service:get-config", { error: true });
      })
  });

  ipcMain.on("service:update-config", (event, opts) => {
    opts = opts || {};
    if (opts.api_key) {
      Raven.setContext({ user: { id: opts.api_key, } })
    }
    Service.set_config(opts);
    storage.update('config-v2', opts)
      .then( updated => {
        event.sender.send("service:update-config", { data: updated });
      })
      .catch( err => {
        console.log(err);
        event.sender.send("service:update-config", { error: true });
      })
  });

  ipcMain.on("service:get-printers", (event, arg) => {
    event.sender.send("service:get-printers", { data: Service.printers });
  });

  ipcMain.on("service:get-status", (event, arg) => {
    event.sender.send("service:get-status", { data: Service.state });
  });

  ipcMain.on("service:dev-tools", (event, arg) => {
    win.webContents.openDevTools();
  });

  ipcMain.on("service:version", (event, arg) => {
    event.sender.send("service:version", { data: app.getVersion() });
  });

  ipcMain.on("system:get-printers", (event, arg) => {
    const printers = win.webContents.getPrinters();
    event.sender.send("system:get-printers", { data: printers });
  });

}

export { Service }