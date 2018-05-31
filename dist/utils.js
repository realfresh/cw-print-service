"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var consoleLog = exports.consoleLog = function consoleLog() {
  var _console;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  (_console = console).log.apply(_console, ["SERVICE - "].concat(args));
};
var cleanDimensions = exports.cleanDimensions = function cleanDimensions(val) {
  if (typeof val == "string") {
    if (val.indexOf("px") !== -1) {
      return val.split("px")[0];
    } else if (val.indexOf("mm") !== -1) {
      return val.split("mm")[0];
    }
  }
  return val.toString();
};