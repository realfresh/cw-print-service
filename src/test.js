// MAIN APP SERVICE
import AppService from './index';

const isProduction = true || process.env.NODE_ENV == 'production';

const Service = new AppService({
  operating_system: "linux",
  ghostscript_path: "./assets/ghostscript/bin/gswin32c.exe",
  path_save_folder: "./assets/save_folder",
  api_key: "4ef1fb0513cbc1492202c152|HyKik07kQ|e4d30d01-3342-4ae5-ade5-35123ceec523",
  api_url_base_64: isProduction ? "https://api.cloudwaitress.com/printing/client/order-to-pdf" : "http://localhost:3010/printing/client/order-to-pdf",
  api_url_ably_auth: isProduction ? "https://api.cloudwaitress.com/printing/client/token-request" : "http://localhost:3010/printing/client/token-request",
});

Service.set_config({ printers: [ "FK80 Printer" ] });

console.log("START APP");

Service.start();
