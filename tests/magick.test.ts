import shell from "shelljs";
import imageSize from "image-size";

const exec = (script: string) => {
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
};

describe("MAGICK", () => {

  const gm = "C:\\Users\\danknugget\\Documents\\CloudWaitressApps\\cw-print-gui\\assets\\graphicsmagick\\gm.exe";
  const save_folder = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files";
  const image = "C:\\Users\\danknugget\\AppData\\Roaming\\PushPrinter\\temp-pdf-files\\650.png";
  const doc_id = "650";

  const trim = async (input: string, output: string) => {
    await exec(`"${gm}"  convert -trim ${input} ${output}`);
  };
  const crop = async (input: string, output: string, cropString: string) => {
    await exec(`"${gm}" convert -crop ${cropString} ${input} ${output}`);
  };
  const extent = async (input: string, output: string, extentString: string) => {
    console.log("EXETENT INPUT %s", input);
    const script = `"${gm}" convert -extent ${extentString} "${input}" "${output}"`;
    await exec(script);
    return script;
  };

  test(`RESIZE BIG IMAGE`, async () => {

    const width = 72 * 5;
    const height = 800 * 5;

    const dimensions = imageSize(image);
    const actualWidth = dimensions.width; // metadata.width as number; // the width of the image
    const actualHeight = dimensions.height; // metadata.height as number; // the height of the image
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

        const file = `${save_folder}/${doc_id}-${splitCount}.png`;
        fileNames.push(file);

        if (done) {
          // CROP THE SMALL REMAINING BIT AND EXTEND IT OUT TO FULL SIZE
          const lastCropHeight = actualHeight - cropY;
          const bufferFile = `${save_folder}/${doc_id}-buffer.png`;
          await crop(image, bufferFile, `${cropWidth}x${lastCropHeight}+${cropX}+${cropY}`);
          await extent(bufferFile, file, `${cropWidth}x${expectedPageHeight}`);
        }
        else {
          await crop(image, file, `${cropWidth}x${cropHeight}+${cropX}+${cropY}`);
        }

        cropY += expectedPageHeight;
        splitCount++;
      }

      return fileNames;

    }
    else {
      console.log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
      const file = `${save_folder}/${doc_id}-0.png`;
      await extent(image, file, `${actualWidth}x${expectedPageHeight}`);
      return [ file ];
    }

  });

});
