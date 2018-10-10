import AppService from '../src/index';
import fs from 'fs';
import shortid from 'shortid';

/*
const path_save_folder = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files";

const saveFile = (base64) => {
  return new Promise((resolve, reject) => {
    const doc_id = shortid.generate();
    const file_path = `${path_save_folder}/${doc_id}.pdf`;
    console.log("SAEVE FILE", file_path);
    fs.writeFile(file_path, base64, 'base64', (err) => {
      if (err)
        reject(err);
      else
        resolve({ file_path, doc_id })
    })
  });
};

saveFile("ass")
  .then(console.log)
  .catch(console.log);
*/
// fs.writeFileSync("C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files/ass.pdf", "ass", "utf8");
const Service = new AppService({
  operating_system: "windows",
  path_save_folder: "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files",
  cache_path: "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\tmp-cache",
  api_url_base_64: "http://localhost:3010/printing/client/order-to-pdf",
  api_url_ably_auth: "http://localhost:3010/printing/client/token-request",
});

Service.set_config({
  printers: [],
  api_key: "HyhFmrL2g|HybYdEMfm|35feadcc-88a6-4a52-a266-a5c5fed33323",
  ghostscript_path: "C:/Program Files/gs/gs9.23/bin/gswin64c.exe",
  number_of_copies: 1
});

Service.on("updates", data => {
  console.log("UPDATES", data);
});

Service.on("updates_status", data => {
  console.log("STATUS UPDATES", data);
});

Service.on("print_job", data => {
  console.log("\n\rJOB UPDATES", data);
});

Service.on("error", e => {
  console.log("ERROR", e);
});

Service.start();

setInterval(() => {}, 1 << 30);