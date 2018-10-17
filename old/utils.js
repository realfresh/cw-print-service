export const consoleLog = (...args) => {
  console.log("SERVICE - ", ...args)
};
export const cleanDimensions = (val) => {
  if (typeof val == "string") {
    if (val.indexOf("px") !== -1) {
      return val.split("px")[0]
    }
    else if (val.indexOf("mm") !== -1) {
      return val.split("mm")[0]
    }
  }
  return val.toString();
}

;