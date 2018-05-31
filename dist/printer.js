'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classAutobind = require('class-autobind');

var _classAutobind2 = _interopRequireDefault(_classAutobind);

var _utils = require('./utils');

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var shell = require("shelljs");
var shortid = require('shortid');

var PrintService = function () {
  function PrintService(opts) {
    _classCallCheck(this, PrintService);

    (0, _classAutobind2.default)(this);
    this.path_ghostscript = opts.path_ghostscript;
    this.path_save_folder = opts.path_save_folder;
    this.operating_system = opts.operating_system;
  }

  _createClass(PrintService, [{
    key: 'create_print_job',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(config) {
        var base64, job_id, jobIdExists;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                base64 = config.base64, job_id = config.job_id;
                _context.next = 3;
                return _cache2.default.get(job_id);

              case 3:
                jobIdExists = _context.sent;

                if (jobIdExists) {
                  _context.next = 12;
                  break;
                }

                (0, _utils.consoleLog)("PRINT JOB", job_id);
                _context.next = 8;
                return this.print(base64, config);

              case 8:
                _context.next = 10;
                return _cache2.default.set(job_id, { error: false });

              case 10:
                _context.next = 13;
                break;

              case 12:
                (0, _utils.consoleLog)("DUPLICATE JOB ID", job_id);

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function create_print_job(_x) {
        return _ref.apply(this, arguments);
      }

      return create_print_job;
    }()
  }, {
    key: 'print',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(base64, config) {
        var _this = this;

        var printers, _ref3, file_path, doc_id;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                printers = config.printers;
                _context2.next = 3;
                return this.file_save(base64);

              case 3:
                _ref3 = _context2.sent;
                file_path = _ref3.file_path;
                doc_id = _ref3.doc_id;

                setTimeout(function () {
                  return _this.file_remove(file_path);
                }, 90000);
                _context2.next = 9;
                return this.print_ghostscript({ file_path: file_path, printers: printers });

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function print(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return print;
    }()
  }, {
    key: 'print_ghostscript',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(_ref4) {
        var file_path = _ref4.file_path,
            printers = _ref4.printers;
        var path_ghostscript, scripts;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                path_ghostscript = this.path_ghostscript;
                scripts = [];

                printers.forEach(function (printer) {
                  var script = '"' + path_ghostscript + '" -dQuiet -dBATCH -dNOPAUSE -sDEVICE=mswinpr2 -sOutputFile="%printer%' + printer + '"  "' + file_path + '"';
                  scripts.push(script);
                });
                _context3.next = 5;
                return this.exec(scripts);

              case 5:
                return _context3.abrupt('return', _context3.sent);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function print_ghostscript(_x4) {
        return _ref5.apply(this, arguments);
      }

      return print_ghostscript;
    }()
  }, {
    key: 'file_save',
    value: function file_save(base64) {
      var path_save_folder = this.path_save_folder;

      return new Promise(function (resolve, reject) {
        var doc_id = shortid.generate();
        var file_path = path_save_folder + '/' + doc_id + '.pdf';
        fs.writeFile(file_path, base64, 'base64', function (err) {
          if (err) reject(err);else resolve({ file_path: file_path, doc_id: doc_id });
        });
      });
    }
  }, {
    key: 'file_remove',
    value: function file_remove(file_path) {
      fs.unlink(file_path, function (err) {
        if (err) console.log("ERROR DELETING FILE", err);
      });
    }
  }, {
    key: '_exec',
    value: function _exec(script) {
      return new Promise(function (resolve, reject) {
        shell.exec(script, function (code, stdout, stderr) {
          if (code == 0) {
            resolve({ data: stdout, exitCode: code });
          } else {
            reject({ error: stderr, exitCode: code });
          }
        });
      });
    }
  }, {
    key: 'exec',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(script) {
        var error, i;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(typeof script == 'string')) {
                  _context4.next = 6;
                  break;
                }

                _context4.next = 3;
                return this._exec(script);

              case 3:
                return _context4.abrupt('return', _context4.sent);

              case 6:
                if (!((typeof script === 'undefined' ? 'undefined' : _typeof(script)) == 'object')) {
                  _context4.next = 24;
                  break;
                }

                error = void 0;
                // EXECUTE THE ARRAY OF SCRIPTS

                i = 0;

              case 9:
                if (!(i < script.length)) {
                  _context4.next = 21;
                  break;
                }

                _context4.prev = 10;
                _context4.next = 13;
                return this._exec(script[i]);

              case 13:
                _context4.next = 18;
                break;

              case 15:
                _context4.prev = 15;
                _context4.t0 = _context4['catch'](10);

                // CATCH ANY ERRORS MANUALLY TO PREVENT INTERRUPTING PRINTING
                error = _context4.t0;

              case 18:
                i++;
                _context4.next = 9;
                break;

              case 21:
                if (!error) {
                  _context4.next = 23;
                  break;
                }

                throw error;

              case 23:
                return _context4.abrupt('return', true);

              case 24:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[10, 15]]);
      }));

      function exec(_x5) {
        return _ref6.apply(this, arguments);
      }

      return exec;
    }()
  }]);

  return PrintService;
}();

exports.default = PrintService;