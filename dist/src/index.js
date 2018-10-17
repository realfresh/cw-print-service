"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const axios_1 = __importDefault(require("axios"));
const ably_1 = __importDefault(require("ably"));
const printer_1 = require("./printer");
const cache_1 = require("./cache");
const logger_1 = require("../libs/common/utils/logger");
const debug_1 = __importDefault(require("debug"));
const autobind = require("class-autobind").default;
const exitHook = require("async-exit-hook");
const log = debug_1.default("PRINT-SERVICE");
Sentry.init({
    dsn: "https://e4f36acab6234be194caa966e4b2c9c4@sentry.io/1302660",
    enabled: process.env.NODE_ENV === "production",
});
class AppService {
    constructor(opts) {
        log(typeof autobind);
        autobind(this);
        this.os = opts.os;
        this.api = opts.api;
        this.copies = opts.copies || 1;
        this.cache = cache_1.CacheCreator(`${opts.paths.save}/temp-db.json`);
        this.state = "disconnected";
        this.callbacks = {};
        this.job_number = 1;
        this.printers = [];
        this.printer = new printer_1.PrintService({
            os: this.os,
            cache: this.cache,
            gm: opts.paths.gm,
            save_folder: opts.paths.save,
        });
        exitHook(this.stop);
        log("INITIALIZED");
    }
    start() {
        log("SERVICE STARTED");
        const { api_key, api, id } = this;
        if (!api_key || !id) {
            logger_1.logger.captureWarning("Missing api key and ID when starting");
            return;
        }
        if (this.ably) {
            this.ably.close();
            delete this.ably;
        }
        this.ably = new ably_1.default.Realtime({
            authCallback: (tokenParams, callback) => {
                const opts = {
                    headers: {
                        Authorization: `Bearer ${api_key}`,
                    },
                };
                axios_1.default.get(api.ably_auth, opts)
                    .then(({ data }) => callback("", data))
                    .catch((e) => {
                    if (e.response && e.response.data === "token-error") {
                        this.onCallback("updates", "token-error");
                        this.stop();
                    }
                    else {
                        logger_1.logger.captureException(e);
                        this.onCallback("updates", "auth-error");
                    }
                    callback(e, "");
                });
            },
            recover: (lastConnectionDetails, cb) => {
                log(lastConnectionDetails);
                cb(true);
            },
        });
        this.ably.connection.on((stateChange) => {
            log("STATE CHANGE: " + stateChange.current);
            this.set_state(stateChange.current);
        });
        this.ably.connection.on("connected", () => {
            if (this.connected_once && this.channels) {
                this.channels.all_printers.presence.enter();
                this.channels.update_restaurant.presence.enter({ type: "printer" });
                this.channels.receive_jobs.history(this.handle_print_job_history);
            }
            this.connected_once = true;
        });
        this.channels = {
            all_printers: this.ably.channels.get(`private:printing-clients`),
            receive_jobs: this.ably.channels.get(`private:printing-client:${api_key}`),
            update_server: this.ably.channels.get(`private:printing-clients:jobs`),
            update_restaurant: this.ably.channels.get(`private:restaurant:${id.restaurant}`),
        };
        this.channels.all_printers.presence.enter();
        this.channels.receive_jobs.subscribe("new-job", this.handle_print_job);
        this.channels.receive_jobs.history(this.handle_print_job_history);
        this.channels.update_restaurant.presence.enter({ type: "printer" });
        this.job_number = 1;
        this.onCallback("updates", "started");
    }
    stop() {
        if (this.ably && this.ably.close) {
            this.ably.close();
            if (this.channels) {
                this.channels.all_printers.presence.leave();
                this.channels.update_restaurant.presence.leave();
            }
            setTimeout(() => {
                delete this.ably;
                this.onCallback("updates", "stopped");
            }, 200);
        }
        this.connected_once = false;
    }
    set_config(opts) {
        if (opts.api_key) {
            const api_key_parts = opts.api_key.split("|");
            this.api_key = opts.api_key;
            this.id = {
                restaurant: api_key_parts[0],
                print_config: api_key_parts[1],
                api_key: api_key_parts[2],
            };
            log(this.id);
        }
        if (opts.printers) {
            this.printers = opts.printers.filter((p) => !!p);
        }
        if (opts.copies) {
            this.copies = opts.copies;
        }
        log("SET CONFIG SERVICE");
    }
    set_state(state) {
        this.state = state;
        this.onCallback("updates_status", state);
    }
    on(event, fn) {
        this.callbacks[`event_callback_${event}`] = fn;
    }
    onCallback(event, data) {
        const fn = this.callbacks[`event_callback_${event}`] || (() => { });
        fn(data);
    }
    handle_print_job(message, fromHistory) {
        return __awaiter(this, void 0, void 0, function* () {
            log(`${this.job_number} - PRINT JOB RECEIVED`, message.data);
            this.onCallback("print_job", { event: "received", data: message.data });
            this.job_number++;
            const data = message.data || {};
            const { job_id, query, notify_restaurant_dashboard } = data;
            try {
                if (this.os === "windows") {
                    const queryData = yield this.api_get_job_image(query);
                    const { base64, width, height, deviceScaleFactor } = queryData;
                    log("BASE64 IMAGE FETCHED", width, height);
                    yield this.printer.print_windows({
                        job_id: job_id,
                        copies: this.copies,
                        printers: this.printers,
                        base64: base64,
                        width: width,
                        height: height,
                        deviceScaleFactor: deviceScaleFactor,
                    });
                }
                else {
                    const queryData = yield this.api_get_job_pdf(query);
                    const { base64, width, height } = queryData;
                    log("BASE64 PDF FETCHED", width, height);
                    yield this.printer.print_linux({
                        copies: this.copies,
                        printers: this.printers,
                        base64: base64,
                        job_id: job_id,
                    });
                }
                log("PRINT JOB COMPLETE");
                if (notify_restaurant_dashboard)
                    this.publish_restaurant_update(data);
                this.publish_server_update(data);
                this.onCallback("print_job", { event: "success", data: message.data });
            }
            catch (e) {
                logger_1.logger.error("PRINT ERROR");
                logger_1.logger.captureException(e.response ? e.response : e);
                data.error = true;
                if (notify_restaurant_dashboard)
                    this.publish_restaurant_update(data);
                this.publish_server_update(data);
                this.onCallback("print_job", { event: "error", data: e });
                this.onCallback("error", e);
            }
        });
    }
    handle_print_job_history(e, resultPage) {
        if (e) {
            logger_1.logger.captureException(e);
        }
        else {
            resultPage.items.forEach((message) => {
                this.handle_print_job(message, true);
            });
            if (resultPage.hasNext()) {
                resultPage.next(this.handle_print_job_history);
            }
        }
    }
    publish_restaurant_update(messageData) {
        log("NOTIFY RESTAURANT");
        if (this.channels)
            this.channels.update_restaurant.publish("printer:job-update", messageData, this.handle_error);
    }
    publish_server_update(messageData) {
        log("NOTIFY SERVER");
        if (this.channels)
            this.channels.update_server.publish("update", messageData, this.handle_error);
    }
    handle_error(err) {
        if (err) {
            logger_1.logger.captureException(err);
            this.onCallback("error", err);
        }
    }
    api_get_job_pdf(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { api_key, api } = this;
            const options = {
                headers: {
                    Authorization: `Bearer ${api_key}`,
                },
            };
            const res = yield axios_1.default.post(api.receipt_pdf, { query }, options);
            return res.data;
        });
    }
    api_get_job_image(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { api_key, api } = this;
            const options = {
                headers: {
                    Authorization: `Bearer ${api_key}`,
                },
            };
            const res = yield axios_1.default.post(api.receipt_image, { query }, options);
            return res.data;
        });
    }
}
exports.AppService = AppService;
//# sourceMappingURL=index.js.map