import {AppService} from "../src";

const Service = new AppService({
  os: "windows",
  copies: 1,
  paths: {
    gm: "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\cw-print-gui\\assets\\graphicsmagick\\gm.exe",
    save: "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files",
  },
  api: {
    receipt_image: "http://localhost:3010/printing/client/order-to-image",
    receipt_pdf: "http://localhost:3010/printing/client/order-to-pdf",
    ably_auth: "http://localhost:3010/printing/client/token-request",
  },
});

Service.set_config({
  printers: ["FK80 Printer"],
  api_key: "HyhFmrL2g|HybYdEMfm|35feadcc-88a6-4a52-a266-a5c5fed33323",
  copies: 1,
});

Service.on("updates", (data) => {
  // console.log("UPDATES", data);
});

Service.on("updates_status", (data) => {
  // console.log("STATUS UPDATES", data);
});

Service.on("print_job", (data) => {
  // console.log("\n\rJOB UPDATES", data);
});

Service.on("error", (e) => {});

Service.start();
