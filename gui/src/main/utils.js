const shelljs = require("shelljs");

export const createDirectory = path => {
  try {
    shelljs.mkdir('-p', path);
  }
  catch(e) {
    console.log(e);
  }
};
