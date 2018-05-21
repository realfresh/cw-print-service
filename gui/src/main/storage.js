const storage = require('electron-json-storage');

console.log(storage.getDataPath());

export default {
  get(key) {
    return new Promise((resolve,reject) => {
      storage.get(key, function(error, data) {
        if (error) reject(error);
        else {
          if (Object.keys(data).length == 0)
            resolve(null);
          else
            resolve(data);
        }
      });
    })
  },
  set(key, json) {
    return new Promise((resolve,reject) => {
      storage.set(key, json, function(error) {
        if (error) reject(error);
        else resolve();
      });
    })
  },
  async update(key, update) {
    const data = await this.get(key);
    const updated = { ...(data || {}), ...(update || {}) };
    await this.set(key, updated);
    return updated;
  },
}