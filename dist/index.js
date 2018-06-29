'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _printer = require('./printer');

var _printer2 = _interopRequireDefault(_printer);

var _classAutobind = require('class-autobind');

var _classAutobind2 = _interopRequireDefault(_classAutobind);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require('axios');
var exitHook = require('async-exit-hook');
var Ably = require('ably');

var AppService = function () {
  function AppService(opts) {
    _classCallCheck(this, AppService);

    (0, _classAutobind2.default)(this);
    this.init(opts);
    this.state = "disconnected";
    exitHook(this.stop);
    (0, _utils.consoleLog)("INITIALIZED");
  }

  _createClass(AppService, [{
    key: 'init',
    value: function init(opts) {
      // SET OPTIONS
      this.cache = (0, _cache2.default)(opts.cache_path);
      this.api_url_base_64 = opts.api_url_base_64;
      this.api_url_ably_auth = opts.api_url_ably_auth;
      this.path_save_folder = opts.path_save_folder;
      this.operating_system = opts.operating_system;
      this.printer = new _printer2.default({
        // path_ghostscript: opts.path_ghostscript,
        path_save_folder: opts.path_save_folder,
        operating_system: opts.operating_system,
        number_of_copies: opts.number_of_copies || 1,
        cache: this.cache
      });
      this.printers = [];
      this.set_config(opts); // GHOSTSCRIPT SET HERE
    }
  }, {
    key: 'start',
    value: function start() {
      var _this = this;

      (0, _utils.consoleLog)("STARTED");

      var api_key = this.api_key,
          api_url_ably_auth = this.api_url_ably_auth,
          r_id = this.r_id;


      if (this.ably) {
        this.ably.close();
        delete this.ably;
      }

      // CONNECT TO ABLY BY AUTHING TO SERVER
      this.ably = new Ably.Realtime({
        authCallback: function authCallback(tokenParams, callback) {
          var opts = {
            headers: {
              'Authorization': 'Bearer ' + api_key
            }
          };
          axios.get(api_url_ably_auth, opts).then(function (_ref) {
            var data = _ref.data;
            return callback(null, data);
          }).catch(function (e) {
            if (e.response && e.response.data == "token-error") {
              _this.onCallback("updates", "token-error");
              _this.stop();
            } else {
              console.log(e);
              _this.onCallback("updates", "auth-error");
            }
            callback(e);
          });
        },
        recover: function recover(lastConnectionDetails, cb) {
          console.log(lastConnectionDetails);
          cb(true);
        }
      });

      // LISTEN TO CONNECTION STATE CHANGES
      this.ably.connection.on(function (stateChange) {
        (0, _utils.consoleLog)('STATE CHANGE: ' + stateChange.current);
        _this.set_state(stateChange.current);
      });

      this.ably.connection.on('connected', function () {
        if (_this.connected_once) {
          _this.channel_all_printers.presence.enter();
          _this.channel_update_restaurant.presence.enter({ type: 'printer' });
          _this.channel_receive_jobs.history(_this.handle_print_job_history);
        }
        _this.connected_once = true;
      });

      // GENERIC PRINTERS CHANNEL
      this.channel_all_printers = this.ably.channels.get('private:printing-clients');
      this.channel_all_printers.presence.enter();

      // RECEIVE PRINT JOBS
      this.channel_receive_jobs = this.ably.channels.get('private:printing-client:' + api_key);
      this.channel_receive_jobs.subscribe("new-job", this.handle_print_job);
      this.channel_receive_jobs.history(this.handle_print_job_history);

      // SEND UPDATES TO SERVER AND CLIENT
      this.channel_update_server = this.ably.channels.get('private:printing-clients:jobs');
      this.channel_update_restaurant = this.ably.channels.get('private:restaurant:' + r_id);
      this.channel_update_restaurant.presence.enter({ type: 'printer' });

      this.job_number = 1;

      this.onCallback("updates", "started");
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this2 = this;

      if (this.ably && this.ably.close) {
        this.ably.close();
        this.channel_all_printers.presence.leave();
        this.channel_update_restaurant.presence.leave();
        delete this.ably;
        setTimeout(function () {
          _this2.onCallback("updates", "stopped");
        }, 200);
      }
      this.connected_once = false;
    }

    // EVENTS

  }, {
    key: 'on',
    value: function on(event, fn) {
      this['event_callback_' + event] = fn;
    }
  }, {
    key: 'onCallback',
    value: function onCallback(event, data) {
      var fn = this['event_callback_' + event] || function () {};
      fn(data);
    }

    // HANDLERS

  }, {
    key: 'handle_print_job',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message) {
        var fromHistory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var data, job_id, query, notify_restaurant_dashboard, _ref3, base64;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                // LOG
                console.log(this.job_number + ' - PRINT JOB RECEIVED', message.data);
                this.onCallback("print_job", { event: "received", data: message.data });

                // INCREMENT JOB NUMBER
                this.job_number++;

                // PARSE DATA
                data = message.data || {};
                job_id = data.job_id, query = data.query, notify_restaurant_dashboard = data.notify_restaurant_dashboard;
                _context.prev = 5;
                _context.next = 8;
                return this.api_get_job_pdf(query);

              case 8:
                _ref3 = _context.sent;
                base64 = _ref3.base64;


                console.log("BASE64 FETCHED");

                // SUBMIT PRINT JOB TO SERVICE
                _context.next = 13;
                return this.printer.create_print_job({
                  printers: this.printers,
                  base64: base64,
                  job_id: job_id
                });

              case 13:

                console.log("PRINT JOB COMPLETE");

                // NOTIFY DASHBOARD IF REQUIRED
                if (notify_restaurant_dashboard) this.publish_restaurant_update(data);

                // UPDATE SERVER OF JOB SUCCESS
                this.publish_server_update(data);

                // LOG
                this.onCallback("print_job", { event: "success", data: message.data });
                _context.next = 28;
                break;

              case 19:
                _context.prev = 19;
                _context.t0 = _context['catch'](5);

                console.log("PRINT ERROR");
                console.log(_context.t0.response ? _context.t0.response : _context.t0);
                data.error = true;

                // NOTIFY DASHBOARD OF ERROR
                if (notify_restaurant_dashboard) this.publish_restaurant_update(data);

                // NOTIFY SERVER
                this.publish_server_update(data);

                // LOG
                this.onCallback("print_job", { event: "error", data: _context.t0 });
                this.onCallback("error", _context.t0);

              case 28:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[5, 19]]);
      }));

      function handle_print_job(_x2) {
        return _ref2.apply(this, arguments);
      }

      return handle_print_job;
    }()
  }, {
    key: 'handle_print_job_history',
    value: function handle_print_job_history(e, resultPage) {
      var _this3 = this;

      if (e) console.log(e);else {
        resultPage.items.forEach(function (message) {
          _this3.handle_print_job(message, true);
        });
        if (resultPage.hasNext()) {
          resultPage.next(this.handle_print_job_history);
        }
      }
    }

    // PUBLISHERS

  }, {
    key: 'publish_restaurant_update',
    value: function publish_restaurant_update(messageData) {
      var _this4 = this;

      (0, _utils.consoleLog)("NOTIFY RESTAURANT");
      this.channel_update_restaurant.publish("printer:job-update", messageData, function (err) {
        if (err) {
          console.log(err);
          _this4.onCallback("error", err);
        }
      });
    }
  }, {
    key: 'publish_server_update',
    value: function publish_server_update(messageData) {
      var _this5 = this;

      (0, _utils.consoleLog)("NOTIFY SERVER");
      this.channel_update_server.publish("update", messageData, function (err) {
        if (err) {
          console.log(err);
          _this5.onCallback("error", err);
        }
      });
    }

    // API

  }, {
    key: 'api_get_job_pdf',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(query) {
        var api_key, api_url_base_64, options, res;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                api_key = this.api_key, api_url_base_64 = this.api_url_base_64;
                options = {
                  headers: {
                    'Authorization': 'Bearer ' + api_key
                  }
                };
                _context2.next = 4;
                return axios.post(api_url_base_64, { query: query }, options);

              case 4:
                res = _context2.sent;
                return _context2.abrupt('return', res.data);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function api_get_job_pdf(_x3) {
        return _ref4.apply(this, arguments);
      }

      return api_get_job_pdf;
    }()

    // SETTERS & UTILS

  }, {
    key: 'set_config',
    value: function set_config(_ref5) {
      var printers = _ref5.printers,
          api_key = _ref5.api_key,
          ghostscript_path = _ref5.ghostscript_path,
          number_of_copies = _ref5.number_of_copies;

      if (api_key) {
        this.api_key = api_key;
        var api_key_parts = api_key.split("|");
        this.r_id = api_key_parts[0];
        this.r_print_config_id = api_key_parts[1];
        this.r_api_key = api_key_parts[1];
      }
      if (printers) {
        this.printers = printers.filter(function (p) {
          return !!p;
        });
      }
      if (ghostscript_path) {
        this.path_ghostscript = ghostscript_path;
        this.printer.path_ghostscript = ghostscript_path;
      }
      if (number_of_copies) {
        this.printer.number_of_copies = number_of_copies || 1;
      }
      console.log("SET CONFIG SERVICE", printers, api_key, number_of_copies);
    }
  }, {
    key: 'set_state',
    value: function set_state(state) {
      this.state = state;
      this.onCallback('updates_status', state);
    }
  }]);

  return AppService;
}();

exports.default = AppService;