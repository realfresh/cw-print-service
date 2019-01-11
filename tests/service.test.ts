import { AppService } from "../src";

describe("SERVICE TEST", () => {

  test(`ERROR FREE INITIALIZATION`, () => {
    expect(() => {

      const Service = new AppService({
        os: "linux",
        copies: 1,
        paths: {
          gm: "",
          save: "/media/danknugget/E802975C02972F16/Users/danknugget/Documents/CloudWaitressApps/cw-print-service/tmp/save",
          print_cli: "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\vs-print-cli\\PrintCLI\\PrintCLI\\bin\\Release\\PrintCLI.exe",
        },
        api: {
          receipt_image: "http://localhost:3010/printing/client/order-to-pdf",
          receipt_pdf: "http://localhost:3010/printing/client/order-to-pdf",
          ably_auth: "http://localhost:3010/printing/client/token-request",
        },
      });

      Service.set_config({
        printers: [],
        api_key: "HyhFmrL2g|HybYdEMfm|35feadcc-88a6-4a52-a266-a5c5fed33323",
        copies: 1,
      });

      Service.on("updates", (data) => {
        console.log("UPDATES", data);
      });

      Service.on("updates_status", (data) => {
        console.log("STATUS UPDATES", data);
      });

      Service.on("print_job", (data) => {
        console.log("\n\rJOB UPDATES", data);
      });

      Service.on("error", (e) => {
        console.log("ERROR", e);
      });

      Service.start();

    }).not.toThrowError();
  });

});
