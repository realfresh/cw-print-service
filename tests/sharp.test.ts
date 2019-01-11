import sharp from "sharp";
import {logger} from "../src/logger";

describe("SHARP", () => {

  test(`RESIZE BIG IMAGE`, () => {
    expect( async () => {

      const save_folder = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files";

      const image = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files\\648.png";
      const doc_id = "648";

      const width = 72 * 5;
      const height = 800 * 5;
      const baseImageBuffer = await sharp(image).trim().toBuffer({ resolveWithObject: true });
      const baseImage = sharp(baseImageBuffer.data);
      const metadata = await baseImage.metadata();

      const actualWidth = baseImageBuffer.info.width; // metadata.width as number; // the width of the image
      const actualHeight = baseImageBuffer.info.height; // metadata.height as number; // the height of the image
      const actualScaleFactor = actualWidth / width;
      // const adjustedBaseWidth = width * actualScaleFactor;
      const expectedPageHeight = Math.floor(height * actualScaleFactor); // the actual height required to be proportional to the width

      console.log(`
      
        RECEIVED WIDTH: ${width}
        RECEIVED HEIGHT: ${height}
    
        ACTUAL WIDTH: ${actualWidth}
        ACTUAL HEIGHT AFTER TRIM: ${actualHeight}
        
        ACTUAL SCALE FACTOR: ${actualScaleFactor}
        
        EXPECTED PAGE HEIGHT: ${expectedPageHeight}
        EXPECTED PAGE HEIGHT NON ROUNDED: ${height * actualScaleFactor}
          
      `);

      if (actualHeight > expectedPageHeight) {
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

          console.log(`
            CROP Y: ${cropY} 
            CROP HEIGHT: ${cropHeight}
          `);

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

          const file = `${save_folder}/${doc_id}-${splitCount}.png`;
          fileNames.push(file);
          await img.png().toFile(file);

          cropY += expectedPageHeight;
          splitCount++;
        }

        return fileNames;

      }
      else {
        // RETURN SINGLE IMAGE AT FULL CORRECT LENGTH
        const img = baseImage.clone();
        console.log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
        // img.resize(actualWidth, expectedPageHeight);
        img.extend({
          top: 0,
          left: 0,
          right: 0,
          bottom: expectedPageHeight - actualHeight,
          background: { r: 255, b: 255, g: 255, alpha: 1 },
        });
        const file = `${save_folder}/${doc_id}-0.png`;
        await img.png().toFile(file);
        return [ file ];
      }

    }).not.toThrowError();
  });

});
