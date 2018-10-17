"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const shelljs_1 = __importDefault(require("shelljs"));
const shortid_1 = __importDefault(require("shortid"));
const sharp_1 = __importDefault(require("sharp"));
const debug_1 = __importDefault(require("debug"));
const autobind = require("class-autobind").default;
const logger_1 = require("../libs/common/utils/logger");
const log = debug_1.default("PRINTER");
class PrintService {
    constructor(opts) {
        autobind(this);
        this.cache = opts.cache;
        this.save_folder = opts.save_folder;
        this.print_cli = path_1.default.resolve(__dirname, "../resources/PrintCLI.exe");
    }
    print_windows(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.print_job_valid(data)) {
                return;
            }
            const { printers, copies, width, height } = data;
            const image_files = yield this.image_split_n_save_sharp(data);
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
        return __awaiter(this, void 0, void 0, function* () {
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
    image_split_n_save_sharp(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { base64, width, height } = data;
            const { file_path, doc_id } = yield this.file_save(base64, "png");
            setTimeout(() => this.file_remove(file_path), 120000);
            const baseImageBuffer = yield sharp_1.default(file_path).trim().toBuffer({ resolveWithObject: true });
            const baseImage = sharp_1.default(baseImageBuffer.data);
            const actualWidth = baseImageBuffer.info.width;
            const actualHeight = baseImageBuffer.info.height;
            const actualScaleFactor = actualWidth / width;
            const expectedPageHeight = Math.round(height * actualScaleFactor);
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
                    const img = baseImage.clone();
                    if (done) {
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
                    yield img.png().toFile(file);
                    cropY += expectedPageHeight;
                    splitCount++;
                }
                return fileNames;
            }
            else if (actualHeight === expectedPageHeight) {
                log("IMAGE: CORRECT HEIGHT");
                const img = baseImage.clone();
                const file = `${this.save_folder}/${doc_id}-0.png`;
                yield img.png().toFile(file);
                return [file];
            }
            else {
                const img = baseImage.clone();
                log("IMAGE: EXTEND PAGE BY %s %s", actualHeight, expectedPageHeight - actualHeight);
                img.extend({
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: expectedPageHeight - actualHeight,
                    background: { r: 255, b: 255, g: 255, alpha: 1 },
                });
                const file = `${this.save_folder}/${doc_id}-0.png`;
                yield img.png().toFile(file);
                return [file];
            }
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
    file_remove(path) {
        fs_1.default.unlink(path, (err) => {
            if (err)
                logger_1.logger.captureException(err, "ERROR DELETING FILE");
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
        return __awaiter(this, void 0, void 0, function* () {
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