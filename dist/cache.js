'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var CachemanFile = require('cacheman-file');

exports.default = function (tmpDir) {

  var opts = {};

  if (tmpDir) {
    opts.tmpDir = tmpDir;
  }

  var cache = new CachemanFile(opts);
  var DEFAULT_TTL = 60 * 60 * 12; // 12 HOURS

  return {
    set: function set(key, data) {
      var ttl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_TTL;

      return new Promise(function (resolve, reject) {
        cache.set(key, data, ttl, function (error) {
          if (error) reject(error);else resolve();
        });
      });
    },
    get: function get(key) {
      return new Promise(function (resolve, reject) {
        cache.get(key, function (error, value) {
          if (error) reject(error);else resolve(value);
        });
      });
    },
    del: function del(key) {
      return new Promise(function (resolve, reject) {
        cache.del(key, function (error) {
          if (error) reject(error);else resolve();
        });
      });
    },
    clear: function clear() {
      return new Promise(function (resolve, reject) {
        cache.clear(key, function (error) {
          if (error) reject(error);else resolve();
        });
      });
    },
    all: function all() {
      return new Promise(function (resolve, reject) {
        cache.getAll(function (error, results) {
          // []
          if (error) reject(error);else resolve(results);
        });
      });
    }
  };
};