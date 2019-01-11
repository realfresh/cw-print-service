// import {AppService} from "../dist";
import {AppService} from "../src";

const test = {
  receipt_image: "http://localhost:3010/printing/client/order-to-image",
  receipt_pdf: "http://localhost:3010/printing/client/order-to-pdf",
  ably_auth: "http://localhost:3010/printing/client/token-request",
};

const real = {
  receipt_image: "https://api.cloudwaitress-test.com/printing/client/order-to-image",
  receipt_pdf: "https://api.cloudwaitress-test.com/printing/client/order-to-pdf",
  ably_auth: "https://api.cloudwaitress-test.com/printing/client/token-request",
};

const realKey = "kFkeSP16a|JeTxpklr0|c312f540-cec9-4e57-9123-7f1fb27dcec8";
const testKey = "kFkeSP16a|BhOAIJJU4|c312f540-cec9-4e57-9123-7f1fb27dcec8";

const Service = new AppService({
  os: "linux",
  copies: 1,
  paths: {
    print_cli: "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\cw-print-gui\\assets\\printcli\\PrintCLI.exe",
    gm: "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\cw-print-gui\\assets\\graphicsmagick\\gm.exe",
    save: "/media/danknugget/E802975C02972F16/Users/danknugget/Documents/CloudWaitressApps/cw-print-service/tmp",
  },
  api: real,
});

Service.set_config({
  printers: ["FK80"],
  api_key: realKey,
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
