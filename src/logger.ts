import * as Sentry from "@sentry/minimal";
import debug from "debug";

debug.formatters.d = (v: number) => {
  return new Date(v).toLocaleString();
};

const error = debug("ERROR");
const warn = debug("WARN");
const info = debug("INFO");
const dev = debug("DEV");

export const logger = {
  captureWarning: (message: string, e?: any) => {
    warn(message || "", e);
    if (message) {
      Sentry.captureMessage(message);
    }
  },
  captureException: (e: any, message?: string) => {
    error(message || "", e);
    // const errorString = _isObject(e) ? JSON.stringify(e, null, 2) : e.toString();
    // Sentry.captureMessage(errorString);
    Sentry.captureException(e);
  },
  error: error,
  warn: warn,
  info: info,
  dev: dev,
};
