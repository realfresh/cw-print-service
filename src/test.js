// MAIN APP SERVICE
import AppService from './index';

const isProduction = process.env.NODE_ENV == 'production';

const Service = new AppService({
  operating_system: "windows",
  ghostscript_path: "./assets/ghostscript/bin/gswin32c.exe",
  path_save_folder: "./assets/save_folder",
  api_key: "HyhFmrL2g|BJlgLIehW|35feadcc-88a6-4a52-a266-a5c5fed33323",
  api_url_base_64: isProduction ? "https://api.cloudwaitress.com/printing/client/order-to-pdf" : "http://localhost:3010/printing/client/order-to-pdf",
  api_url_ably_auth: isProduction ? "https://api.cloudwaitress.com/printing/client/token-request" : "http://localhost:3010/printing/client/token-request",
});

Service.set_config({ printers: [ "FK80 Printer" ] });

console.log("START APP");

Service.start();
