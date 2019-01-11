"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Sentry = tslib_1.__importStar(require("@sentry/minimal"));
const debug_1 = tslib_1.__importDefault(require("debug"));
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
//# sourceMappingURL=logger.js.map