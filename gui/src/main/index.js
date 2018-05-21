import "./polyfills";
import config from './config';
import {
  initWindow,
  restoreWindowOnMultipleInstances,
  handleMultipleInstances
} from './electron';
import { createDirectory } from './utils';
const { app } = require('electron');
const Raven = require('raven');

Raven.config('https://a763da792a694fc98654bf2d8bfb0986@sentry.io/1210296', {
  autoBreadcrumbs: true,
  captureUnhandledRejections: true,
}).install();

Raven.context(() => {

  // CREATE SAVE FOLDER
  createDirectory(config.savePath);

  // CHECK FOR MULTIPLE INSTANCES
  const multiple_instances_running = app.makeSingleInstance(restoreWindowOnMultipleInstances);

  if (multiple_instances_running) {
    // HANDLE MULTI INSTANCES
    handleMultipleInstances();
  }
  else {
    // INIT APPLICATION
    initWindow();
  }

});
