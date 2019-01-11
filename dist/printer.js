"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const shelljs_1 = tslib_1.__importDefault(require("shelljs"));
const shortid_1 = tslib_1.__importDefault(require("shortid"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const image_size_1 = tslib_1.__importDefault(require("image-size"));
const autobind = require("class-autobind").default;
const logger_1 = require("./logger");
const log = debug_1.default("PRINTER");
class PrintService {
    constructor(opts) {
        autobind(this);
        this.gm = opts.gm;
        this.cache = opts.cache;
        this.save_folder = opts.save_folder;
        this.print_cli = opts.print_cli;
    }
    print_windows(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.print_job_valid(data)) {
                return;
            }
            const { printers, copies, width, height } = data;
            const image_files = yield this.image_split_n_save_gm(data);
            const scripts = [];
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
            yield this.exec(scripts);
            this.cache.set(data.job_id, { error: false });
        });
    }
    print_linux(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.print_job_valid(data)) {
                return;
            }
            const { printers, copies, base64 } = data;
            const { file_path } = yield this.file_save(base64, "pdf");
            setTimeout(() => this.file_remove(file_path), 90000);
            const scripts = [];
            for (const printer of printers) {
                for (let i = 0; i < copies; i++) {
                    const script = `lp -d "${printer}" "${file_path}"`;
                    log(`PRINT SCRIPT: ${script}`);
                    scripts.push(script);
                }
            }
            yield this.exec(scripts);
            this.cache.set(data.job_id, { error: false });
        });
    }
    print_job_valid(data) {
        const { job_id } = data;
        const jobExists = this.cache.get(job_id);
        if (!jobExists) {
            log(`PRINT JOB ${job_id}`);
            return true;
        }
        logger_1.logger.warn(`DUPLICATE JOB ID ${job_id}`);
        return false;
    }
    image_split_n_save_gm(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { base64, width, height } = data;
            const { file_path, doc_id } = yield this.file_save(base64, "png");
            setTimeout(() => this.file_remove(file_path), 160000);
            const dimensions = image_size_1.default(file_path);
            const actualWidth = dimensions.width;
            const actualHeight = dimensions.height;
            const actualScaleFactor = actualWidth / width;
            const expectedPageHeight = Math.floor(height * actualScaleFactor);
            if (actualHeight > expectedPageHeight) {
                log("IMAGE: SPLIT MULTI PAGE");
                const fileNames = [];
                const cropX = 0;
                const cropWidth = actualWidth;
                let cropY = 0;
                const cropHeight = expectedPageHeight;
                let splitCount = 0;
                let notDone = true;
                while (notDone) {
                    const done = (cropY + cropHeight) >= actualHeight;
                    notDone = !done;
                    const file = `${this.save_folder}/${doc_id}-${splitCount}.png`;
                    fileNames.push(file);
                    if (done) {
                        const lastCropHeight = actualHeight - cropY;
                        const bufferFile = `${this.save_folder}/${doc_id}-buffer.png`;
                        setTimeout(() => this.file_remove(bufferFile), 160000);
                        yield this.gm_crop(file_path, bufferFile, `${cropWidth}x${lastCropHeight}+${cropX}+${cropY}`);
                        yield this.gm_extent(bufferFile, file, `${cropWidth}x${expectedPageHeight}`);
                    }
                    else {
                        yield this.gm_crop(file_path, file, `${cropWidth}x${cropHeight}+${cropX}+${cropY}`);
                    }
                    cropY += expectedPageHeight;
                    splitCount++;
                }
                return fileNames;
            }
            else if (actualHeight === expectedPageHeight) {
                log("IMAGE: CORRECT HEIGHT");
                return [file_path];
            }
            else {
                log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
                const file = `${this.save_folder}/${doc_id}-0.png`;
                yield this.gm_extent(file_path, file, `${actualWidth}x${expectedPageHeight}`);
                return [file];
            }
        });
    }
    gm_trim(input, output) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.exec(`"${this.gm}"  convert -trim ${input} ${output}`);
        });
    }
    gm_crop(input, output, cropString) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.exec(`"${this.gm}" convert -crop ${cropString} ${input} ${output}`);
        });
    }
    gm_extent(input, output, extentString) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.exec(`"${this.gm}" convert -extent ${extentString} "${input}" "${output}"`);
        });
    }
    file_save(base64, extension) {
        return new Promise((resolve, reject) => {
            const doc_id = shortid_1.default.generate();
            const file_path = `${this.save_folder}/${doc_id}.${extension}`;
            console.log("SAVE FILE", this.save_folder);
            fs_1.default.writeFile(file_path, base64, "base64", (err) => {
                if (err)
                    reject(err);
                else
                    resolve({ file_path, doc_id });
            });
        });
    }
    file_remove(file) {
        fs_1.default.unlink(file, (err) => {
            if (err) {
                log(err);
            }
        });
    }
    _exec(script) {
        return new Promise((resolve, reject) => {
            shelljs_1.default.exec(script, (code, stdout, stderr) => {
                if (code === 0) {
                    resolve({ data: stdout, exitCode: code });
                }
                else {
                    reject({ error: stderr, exitCode: code });
                }
            });
        });
    }
    exec(script) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof script === "string") {
                return yield this._exec(script);
            }
            let error;
            for (const s of script) {
                try {
                    yield this._exec(s);
                }
                catch (err) {
                    error = err;
                }
            }
            if (error)
                throw error;
            return true;
        });
    }
}
exports.PrintService = PrintService;
//# sourceMappingURL=printer.js.map