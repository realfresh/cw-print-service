const CachemanFile = require('cacheman-file');
const cache = new CachemanFile({

});

const DEFAULT_TTL = 60 * 60 * 24; // 1 DAY

export default {
  set(key, data, ttl=DEFAULT_TTL) {
    return new Promise((resolve, reject) => {
      cache.set(key, data, ttl, function (error) {
        if (error)
          reject(error);
        else
          resolve()
      });
    });
  },
  get(key) {
    return new Promise((resolve, reject) => {
      cache.get(key, function (error, value) {
        if (error)
          reject(error);
        else
          resolve(value)
      });
    });
  },
  del(key) {
    return new Promise((resolve, reject) => {
      cache.del(key, function (error) {
        if (error)
          reject(error);
        else
          resolve()
      });
    });
  },
  clear() {
    return new Promise((resolve, reject) => {
      cache.clear(key, function (error) {
        if (error)
          reject(error);
        else
          resolve()
      });
    });
  },
  all() {
    return new Promise((resolve, reject) => {
      cache.getAll(function (error, results) { // []
        if (error)
          reject(error);
        else
          resolve(results)
      });
    });
  }
}