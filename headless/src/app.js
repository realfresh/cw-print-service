// SPAWN AND MANAGE THE MAIN APP SERVICE
const pm2 = require("pm2");
const argv = require('yargs').argv;
const fs = require("fs");
const path = require("path");

const PROCESS_NAME = "main";
const COMMAND = (argv.c || argv.command) ? (argv.c || argv.command).toLowerCase() : "";
const SCRIPT_FILE = "./assets/service.js";

/*
const JSON_CONFIG_FILE = "./config.json";

const json_config = fs.readFileSync(JSON_CONFIG_FILE);
const config = json_config ? JSON.parse(json_config) : {};

const required_keys = ["api_key"];

for (let i = 0; i < required_keys.length; i++) {
  if (!config[required_keys[i]])
    throw "Missing API Key From Config File"
}
*/

let count = 1;
console.log("START NOW");
setInterval(() => {
  console.log(count);
  count++;
}, 500);

pm2.connect(function(err) {

  if (err) {
    console.error(err);
    process.exit(2);
  }

  if (COMMAND == "start") {
    pm2.start({
      name: PROCESS_NAME,
      script : SCRIPT_FILE,         // Script to be run
      exec_mode : 'fork',
      output: "./output.log",
      error: "./error.log",
      env: {
        "NODE_ENV": "development",
      },
      // max_memory_restart : '100M'   // Optional: Restarts your app if it reaches 100Mo
    }, function(err, apps) {
      pm2.disconnect();
      if (err)
        throw err
    });
  }
  else if (COMMAND == "restart") {
    pm2.reload(PROCESS_NAME, function(err) {
      pm2.disconnect();
      if (err)
        throw err
    });
  }
  else if (COMMAND == "stop") {
    pm2.delete(PROCESS_NAME, function(err) {
      pm2.disconnect();
      if (err)
        throw err
    });
  }
  else {
    pm2.disconnect();
  }

});