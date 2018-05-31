'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isProduction = process.env.NODE_ENV == 'production'; // MAIN APP SERVICE


var Service = new _index2.default({
  operating_system: "windows",
  ghostscript_path: "./assets/ghostscript/bin/gswin32c.exe",
  path_save_folder: "./assets/save_folder",
  api_key: "HyhFmrL2g|BJlgLIehW|35feadcc-88a6-4a52-a266-a5c5fed33323",
  api_url_base_64: isProduction ? "https://api.cloudwaitress.com/printing/client/order-to-pdf" : "http://localhost:3010/printing/client/order-to-pdf",
  api_url_ably_auth: isProduction ? "https://api.cloudwaitress.com/printing/client/token-request" : "http://localhost:3010/printing/client/token-request"
});

Service.set_config({ printers: ["FK80 Printer"] });

console.log("START APP");

Service.start();