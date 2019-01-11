import fs from "fs";
import shell from "shelljs";
import shortid from "shortid";
import debug from "debug";
import imageSize from "image-size";
const autobind = require("class-autobind").default;
import {logger} from "./logger";
import {CacheCreator} from "./cache";
import {PrintServicePrintLinuxOpts, PrintServicePrintWindowsOpts, PrintServiceOptions} from "./types";

const log = debug("PRINTER");

export class PrintService {

  public gm: string;
  public print_cli: string;
  public save_folder: string;
  public cache: ReturnType<typeof CacheCreator>;

  constructor(opts: PrintServiceOptions) {
    autobind(this);
    this.gm = opts.gm;
    this.cache = opts.cache;
    this.save_folder = opts.save_folder;
    this.print_cli = opts.print_cli;
  }

  public async print_windows(data: PrintServicePrintWindowsOpts) {

    if (!this.print_job_valid(data)) {
      return;
    }

    const { printers, copies, width, height } = data;
    const image_files = await this.image_split_n_save_gm(data);

    const scripts: string[] = [];

    for (const printer of printers) {
      for (let i = 0; i < copies; i++) {
        let script = `"${this.print_cli}" ${width} ${height} "0,0,0,0" "${printer}"`;
        for (const image of image_files) {
          script += ` "${image}"`;
          setTimeout(() => this.file_remove(image), 120000);
        }
        scripts.push(script);
      }
    }

    await this.exec(scripts);

    this.cache.set(data.job_id, { error: false });

  }
  public async print_linux(data: PrintServicePrintLinuxOpts) {

    if (!this.print_job_valid(data)) {
      return;
    }

    const { printers, copies, base64 } = data;
    const { file_path } = await this.file_save(base64, "pdf");
    setTimeout(() => this.file_remove(file_path), 90000);

    const scripts: string[] = [];

    for (const printer of printers) {
      for (let i = 0; i < copies; i++) {
        const script = `lp -d "${printer}" "${file_path}"`;
        log(`PRINT SCRIPT: ${script}`);
        scripts.push(script);
      }
    }

    await this.exec(scripts);

    this.cache.set(data.job_id, { error: false });

  }
  private print_job_valid(data: PrintServicePrintLinuxOpts | PrintServicePrintWindowsOpts) {
    const { job_id } = data;
    const jobExists = this.cache.get(job_id);
    if (!jobExists) {
      log(`PRINT JOB ${job_id}`);
      return true;
    }
    logger.warn(`DUPLICATE JOB ID ${job_id}`);
    return false;
  }

  /*
  private async image_split_n_save_jimp(data: APIPrintingClientOrderToImageResponse) {
    const { base64, width, height } = data; // deviceScaleFactor
    const { file_path, doc_id } = await this.file_save(base64, "png");
    setTimeout(() => this.file_remove(file_path), 120000);

    const baseImage = await jimp.read(file_path);

    baseImage.autocrop({
      tolerance: 0,
      cropOnlyFrames: false,
      // cropSymmetric?: boolean;
      // leaveBorder?: number;
    });

    const actualWidth = baseImage.bitmap.width; // the width of the image
    const actualHeight = baseImage.bitmap.height; // the height of the image

    const actualScaleFactor = actualWidth / width;

    // const adjustedBaseWidth = width * actualScaleFactor;
    const adjustedBaseHeight = height * actualScaleFactor;

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

    if (actualHeight > adjustedBaseHeight) {
      // SPLIT IMAGES
      const fileNames = [];

      const cropX = 0;
      const cropWidth = actualWidth;

      let cropY = 0; // start crop
      const cropHeight = adjustedBaseHeight; // end crop

      let splitCount = 0;

      let notDone = true;

      while (notDone) {
        const done = (cropY + cropHeight) >= actualHeight;
        notDone = !done;

        // console.log(`CROP Y: ${cropY} || CROP HEIGHT: ${cropHeight}`);

        const img = baseImage.clone();

        img.crop(cropX, cropY, cropWidth, cropHeight);

        const file = `${this.save_folder}/${doc_id}-${splitCount}.png`;
        fileNames.push(file);
        await img.writeAsync(file);

        cropY += adjustedBaseHeight;
        splitCount++;
      }

      return fileNames;

    }
    else {
      // RETURN SINGLE IMAGE AT FULL CORRECT LENGTH
      const actualFullHeight = actualScaleFactor * height;
      const img = baseImage.clone();
      img.crop(0, 0, actualWidth, actualFullHeight);
      const file = `${this.save_folder}/${doc_id}-0.png`;
      await img.writeAsync(file);
      return [ file ];
    }

  }
  */
  /*
  private async image_split_n_save_sharp(data: APIPrintingClientOrderToImageResponse) {
    const { base64, width, height } = data; // deviceScaleFactor
    const { file_path, doc_id } = await this.file_save(base64, "png");
    setTimeout(() => this.file_remove(file_path), 120000);

    const baseImageBuffer = await sharp(file_path).trim().toBuffer({ resolveWithObject: true });
    const baseImage = sharp(baseImageBuffer.data);

    // const metadata = await baseImage.metadata();
    const actualWidth = baseImageBuffer.info.width; // metadata.width as number; // the width of the image
    const actualHeight = baseImageBuffer.info.height; // metadata.height as number; // the height of the image

    const actualScaleFactor = actualWidth / width;
    // const adjustedBaseWidth = width * actualScaleFactor;
    const expectedPageHeight = Math.round(height * actualScaleFactor); // the actual height required to be proportional to the width

    if (actualHeight > expectedPageHeight) {
      log("IMAGE: SPLIT MULTI PAGE");
      // SPLIT IMAGES
      const fileNames = [];

      const cropX = 0;
      const cropWidth = actualWidth;

      let cropY = 0; // start crop
      const cropHeight = expectedPageHeight; // end crop

      let splitCount = 0;

      let notDone = true;

      while (notDone) {
        const done = (cropY + cropHeight) >= actualHeight;
        notDone = !done;

        const img = baseImage.clone();

        if (done) {
          // CROP THE SMALL REMAINING BIT AND EXTEND IT OUT TO FULL SIZE
          const lastCropHeight = actualHeight - cropY;
          img.extract({
            left: cropX,
            width: cropWidth,
            top: cropY,
            height: lastCropHeight,
          }).extend({
            top: 0,
            left: 0,
            right: 0,
            bottom: expectedPageHeight - lastCropHeight,
            background: { r: 255, b: 255, g: 255, alpha: 1 },
          });
        }
        else {
          img.extract({
            left: cropX,
            width: cropWidth,
            top: cropY,
            height: cropHeight,
          });
        }

        const file = `${this.save_folder}/${doc_id}-${splitCount}.png`;
        fileNames.push(file);
        await img.png().toFile(file);

        cropY += expectedPageHeight;
        splitCount++;
      }

      return fileNames;

    }
    else if (actualHeight === expectedPageHeight) {
      log("IMAGE: CORRECT HEIGHT");
      const img = baseImage.clone();
      const file = `${this.save_folder}/${doc_id}-0.png`;
      await img.png().toFile(file);
      return [ file ];
    }
    else {
      // RETURN SINGLE IMAGE AT FULL CORRECT LENGTH
      const img = baseImage.clone();
      log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
      // img.resize(actualWidth, expectedPageHeight);
      img.extend({
        top: 0,
        left: 0,
        right: 0,
        bottom: expectedPageHeight - actualHeight,
        background: { r: 255, b: 255, g: 255, alpha: 1 },
      });
      const file = `${this.save_folder}/${doc_id}-0.png`;
      await img.png().toFile(file);
      return [ file ];
    }

  }
  */
  private async image_split_n_save_gm(data: APIReceiptConvertImageResponse) {
    const { base64, width, height } = data; // deviceScaleFactor
    const { file_path, doc_id } = await this.file_save(base64, "png");
    setTimeout(() => this.file_remove(file_path), 160000);

    const dimensions = imageSize(file_path);
    const actualWidth = dimensions.width; // metadata.width as number; // the width of the image
    const actualHeight = dimensions.height; // metadata.height as number; // the height of the image
    const actualScaleFactor = actualWidth / width;
    // const adjustedBaseWidth = width * actualScaleFactor;
    const expectedPageHeight = Math.floor(height * actualScaleFactor); // the actual height required to be proportional to the width

    if (actualHeight > expectedPageHeight) {

      log("IMAGE: SPLIT MULTI PAGE");

      // SPLIT IMAGES
      const fileNames = [];

      const cropX = 0;
      const cropWidth = actualWidth;

      let cropY = 0; // start crop
      const cropHeight = expectedPageHeight; // end crop

      let splitCount = 0;

      let notDone = true;

      while (notDone) {
        const done = (cropY + cropHeight) >= actualHeight;
        notDone = !done;
        const file = `${this.save_folder}/${doc_id}-${splitCount}.png`;
        fileNames.push(file);
        if (done) {
          // CROP THE SMALL REMAINING BIT AND EXTEND IT OUT TO FULL SIZE
          const lastCropHeight = actualHeight - cropY;
          const bufferFile = `${this.save_folder}/${doc_id}-buffer.png`;
          setTimeout(() => this.file_remove(bufferFile), 160000);
          await this.gm_crop(file_path, bufferFile, `${cropWidth}x${lastCropHeight}+${cropX}+${cropY}`);
          await this.gm_extent(bufferFile, file, `${cropWidth}x${expectedPageHeight}`);
        }
        else {
          await this.gm_crop(file_path, file, `${cropWidth}x${cropHeight}+${cropX}+${cropY}`);
        }
        cropY += expectedPageHeight;
        splitCount++;
      }

      return fileNames;

    }
    else if (actualHeight === expectedPageHeight) {
      log("IMAGE: CORRECT HEIGHT");
      return [ file_path ];
    }
    else {
      // RETURN SINGLE IMAGE AT FULL CORRECT LENGTH
      log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
      const file = `${this.save_folder}/${doc_id}-0.png`;
      await this.gm_extent(file_path, file, `${actualWidth}x${expectedPageHeight}`);
      return [ file ];
    }
  }

  private async gm_trim(input: string, output: string) {
    await this.exec(`"${this.gm}"  convert -trim ${input} ${output}`);
  }
  private async gm_crop(input: string, output: string, cropString: string){
    await this.exec(`"${this.gm}" convert -crop ${cropString} ${input} ${output}`);
  }
  private async gm_extent(input: string, output: string, extentString: string) {
    await this.exec(`"${this.gm}" convert -extent ${extentString} "${input}" "${output}"`);
  }

  private file_save(base64: string, extension: "pdf" | "png"): Promise<{ file_path: string; doc_id: string; }> {
    return new Promise((resolve, reject) => {
      const doc_id = shortid.generate();
      const file_path = `${this.save_folder}/${doc_id}.${extension}`;
      console.log("SAVE FILE", this.save_folder);
      fs.writeFile(file_path, base64, "base64", (err) => {
        if (err)
          reject(err);
        else
          resolve({ file_path, doc_id });
      });
    });
  }
  private file_remove(file: string) {
    fs.unlink(file, (err) => {
      if (err) {
        log(err);
      }
    });
  }

  private _exec(script: string) {
    return new Promise((resolve, reject) => {
      shell.exec(script, (code, stdout, stderr) => {
        if (code === 0) {
          resolve({data: stdout, exitCode: code });
        }
        else {
          reject({error: stderr, exitCode: code });
        }
      });
    });
  }
  private async exec(script: string | string[]) {
    if (typeof script === "string") {
      return await this._exec(script);
    }
    let error;
    // EXECUTE THE ARRAY OF SCRIPTS
    for (const s of script) {
      try {
        await this._exec(s);
      }
      catch (err) {
        // CATCH ANY ERRORS MANUALLY TO PREVENT INTERRUPTING PRINTING
        error = err;
      }
    }
    // THROW THE ERROR AFTER ATTEMPTING TO PRINT TO ALL PRINTERS
    if (error)
      throw error;
    return true;
  }
}
