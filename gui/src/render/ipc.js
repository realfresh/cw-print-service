import { ipcRenderer } from 'electron';

export default {

  on(event, callback) {
    ipcRenderer.on(event, (event, message) => {
      callback(message);
    });
  },

  send(event, data) {
    return ipcRenderer.send(event, data);
  },
  send_wait(event, data) {
    return new Promise((resolve, reject) => {
      let timeout;
      // IN CASE IPC TIMES OUT
      timeout = setTimeout(() => {
        reject('timed-out');
      }, 30000);
      // SET LISTENER
      ipcRenderer.once(event, (event, data) => {
        clearTimeout(timeout);
        if (typeof data == "object" && data.error) {
          reject(data);
        }
        else {
          resolve(data);
        }
      });
      // SEND REQUEST
      ipcRenderer.send(event, data);
    })
  },

  service_start() {
    this.send("service:start");
  },
  service_stop() {
    this.send("service:stop");
  },

  async service_get_config() {
    return await this.send_wait("service:get-config");
  },
  async service_update_config(update) {
    return await this.send_wait("service:update-config", update);
  },
  async service_get_status() {
    return await this.send_wait("service:get-status")
  },
  async service_get_printers() {
    return await this.send_wait("service:get-printers")
  },
  async service_get_version() {
    return await this.send_wait("service:version")
  },

  service_dev_tools() {
    this.send("service:dev-tools");
  },

  async system_get_printers() {
    return await this.send_wait("system:get-printers")
  },

}