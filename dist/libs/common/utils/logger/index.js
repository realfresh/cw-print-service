"use strict";
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
const Sentry = __importStar(require("@sentry/minimal"));
const debug_1 = __importDefault(require("debug"));
debug_1.default.formatters.d = (v) => {
    return new Date(v).toLocaleString();
};
const error = debug_1.default("ERROR");
const warn = debug_1.default("WARN");
const info = debug_1.default("INFO");
const dev = debug_1.default("DEV");
exports.logger = {
    captureWarning: (message, e) => {
        warn(message || "", e);
        if (message) {
            Sentry.captureMessage(message);
        }
    },
    captureException: (e, message) => {
        error(message || "", e);
        Sentry.captureException(e);
    },
    error: error,
    warn: warn,
    info: info,
    dev: dev,
};
//# sourceMappingURL=index.js.map