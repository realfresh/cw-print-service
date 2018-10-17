import axios from 'axios';
import fs from 'fs';
const jimp = require('jimp');
const shell = require("shelljs");

const API_KEY = "HyhFmrL2g|HybYdEMfm|35feadcc-88a6-4a52-a266-a5c5fed33323"; // MAIN
const API_URL = "http://localhost:3010/printing/client/order-to-pdf";
const SAVE_FOLDER = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files";
const PDF_PRINTER_EXE = "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\vs-print-cli\\PrintCLI\\PrintCLI\\bin\\Release\\PrintCLI.exe";
const PRINTER_NAME = "FK80 Printer";

const ORDERS = [
  //{ restaurant_id: "HyhFmrL2g", number: "648" },
  { restaurant_id: "HyhFmrL2g", number: "649" },
  // { restaurant_id: "HyhFmrL2g", number: "650" },
];


const getPDF = async (query) => {
  const options = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    },
  };
  const res = await axios.post(API_URL, { query }, options);
  return res.data;
};
const saveFile = async (base64, number) => {
  return new Promise((resolve, reject) => {
    const file_path = `${SAVE_FOLDER}/${number}.pdf`;
    console.log("SAVE FILE", SAVE_FOLDER);
    fs.writeFile(file_path, base64, 'base64', (err) => {
      if (err)
        reject(err);
      else
        resolve({ file_path, number })
    })
  });
};
const saveImage = async (base64, number) => {
  return new Promise((resolve, reject) => {
    const file_path = `${SAVE_FOLDER}/${number}.png`;
    console.log("SAVE FILE", SAVE_FOLDER);
    fs.writeFile(file_path, base64, 'base64', (err) => {
      if (err)
        reject(err);
      else
        resolve({ file_path, number })
    })
  });
};
const removeLineBreaks = text => text.replace(/\r?\n|\r/gm,"");
const _exec = (script) => {
  return new Promise((resolve, reject) => {
    shell.exec(script, (code, stdout, stderr) => {
      if (code == 0) {
        resolve({data: stdout, exitCode: code });
      }
      else {
        reject({error: stderr, exitCode: code });
      }
    });
  })
};

const print = async ({ width, height, margins, files }) => {
  let exeString = `${PDF_PRINTER_EXE} ${width} ${height} ${margins} "${PRINTER_NAME}"`;
  files.forEach( f => {
    exeString += ` "${f}"`
  });
  return await _exec(exeString);
};

const splitImage = async ({ number, imageBase64, deviceScaleFactor, baseImageWidth, baseImageHeight }) => {

  const { file_path } = await saveImage(imageBase64, number);

  const baseImage = await jimp.read(file_path);

  baseImage.autocrop({
    tolerance: 0,
    cropOnlyFrames: false,
    // cropSymmetric?: boolean;
    // leaveBorder?: number;
  });

  const actualWidth = baseImage.bitmap.width; // the width of the image
  const actualHeight = baseImage.bitmap.height; // the height of the image

  const actualScaleFactor = actualWidth / baseImageWidth;

  const adjustedBaseWidth = baseImageWidth * actualScaleFactor; // wrong
  const adjustedBaseHeight = baseImageHeight * actualScaleFactor; // wrong

  console.log(`
    BASE WIDTH: ${baseImageWidth}
    BASE HEIGHT: ${baseImageHeight}
    SCALE FACTOR: ${deviceScaleFactor}
  
    ACTUAL WIDTH: ${actualWidth}
    ACTUAL HEIGHT: ${actualHeight}
    ACTUAL SCALE FACTOR: ${actualScaleFactor}
    
    ADJUSTED WIDTH: ${adjustedBaseWidth}
    ADJUSTED HEIGHT: ${adjustedBaseHeight}
  `);

  console.log(adjustedBaseHeight);

  if (actualHeight > adjustedBaseHeight) {
    // SPLIT IMAGES
    console.log("SPLIT IMAGE");
    const fileNames = [];

    const cropX = 0;
    const cropWidth = actualWidth;

    let cropY = 0; // start crop
    let cropHeight = adjustedBaseHeight; // end crop

    let splitCount = 0;

    let notDone = true;

    while (notDone) {

      const done = (cropY + cropHeight) >= actualHeight;
      notDone = !done;

      console.log(`CROP Y: ${cropY} || CROP HEIGHT: ${cropHeight}`);

      const img = baseImage.clone();

      img.crop(cropX, cropY, cropWidth, cropHeight);

      const file = __dirname + `/img-${number}-${splitCount}.png`;
      fileNames.push(file);
      await img.writeAsync(file);

      cropY += adjustedBaseHeight;
      splitCount++;
    }

    return fileNames;

  }
  else {
    // RETURN SINGLE IMAGE AT FULL CORRECT LENGTH
    /*
    img.autocrop({
      tolerance: 0,
      cropOnlyFrames: false,
      // cropSymmetric?: boolean;
      // leaveBorder?: number;
    });
    */
    console.log("SINGLE");
    const actualFullHeight = actualScaleFactor * baseImageHeight;
    const img = baseImage.clone();
    img.crop(0, 0, actualWidth, actualFullHeight);
    const file = __dirname + `/img-${number}-0.png`;
    await img.writeAsync(file);
    return [ file ]
  }

};

const execute = async () => {
  for (let i = 0; i < ORDERS.length; i++) {

    const query = ORDERS[i];

    const {

      imageBase64,
      deviceScaleFactor,
      baseImageWidth,
      baseImageHeight,

      base64,
      height, // mm
      width, // mm

    } = await getPDF(query);

    const files = await splitImage({
      imageBase64,
      deviceScaleFactor,
      baseImageWidth,
      baseImageHeight,
      number: query.number,
    });

    await print({
      width: baseImageWidth,
      height: baseImageHeight,
      margins: "0,0,0,0",
      files: files,
    });

    console.log(files);

    // const d = await saveFile(base64, query.number);

    // console.log(imageBase64);
    /*
    const res = await print({
      width: "72",
      height: "210",
      margins: "0,0,0,0",
      files: [

      ],
    });
    */
    // const status = removeLineBreaks(res.data);
    // console.log("PRINTED", query.number, status);
    // console.log(`HEIGHT: ${heightVal} - Width: ${widthVal}`);
    // const res = await print2({ file: file_path, width: widthVal, height: heightVal });
  }
};

execute().catch(console.log);

/*
print({
  file: b,
  width: "0",
  height: "0" //  || "539" || "1154",
})
  .then(res => {
    console.log(res);
    const data = removeLineBreaks(res.data);
    console.log(data === "FAIL")
  })
  .catch( e => console.log("STDERR"));
*/
