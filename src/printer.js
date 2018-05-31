import autobind from 'class-autobind';
import { consoleLog } from './utils';
import cache from './cache';

const fs = require('fs');
const shell = require("shelljs");
const shortid = require('shortid');

export default class PrintService {

  constructor(opts) {
    autobind(this);
    this.path_ghostscript = opts.path_ghostscript;
    this.path_save_folder = opts.path_save_folder;
    this.operating_system = opts.operating_system;
  }

  async create_print_job(config) {
    const { base64, job_id } = config;
    const jobIdExists = await cache.get(job_id);
    if (!jobIdExists) {
      consoleLog("PRINT JOB", job_id);
      await this.print(base64, config);
      await cache.set(job_id, { error: false });
    }
    else {
      consoleLog("DUPLICATE JOB ID", job_id);
    }
  }
  async print(base64, config) {
    const { printers } = config;
    const { file_path, doc_id } = await this.file_save(base64);
    setTimeout(() => this.file_remove(file_path), 90000);
    if (this.operating_system == "linux") {
      await this.print_cups({ file_path, printers });
    }
    else {
      await this.print_ghostscript({ file_path, printers });
    }
  }

  async print_cups({ file_path, printers }) {
    const scripts = [];
    printers.forEach((printer) => {
      const script = `lp -p "${printer}" "${file_path}"`;
      scripts.push(script);
    });
    return await this.exec(scripts);
  }

  async print_ghostscript({ file_path, printers }) {
    const { path_ghostscript } = this;
    const scripts = [];
    printers.forEach((printer) => {
      const script = `"${path_ghostscript}" -dQuiet -dBATCH -dNOPAUSE -sDEVICE=mswinpr2 -sOutputFile="%printer%${printer}"  "${file_path}"`;
      scripts.push(script);
    });
    return await this.exec(scripts);
  }

  file_save(base64) {
    const { path_save_folder } = this;
    return new Promise((resolve, reject) => {
      const doc_id = shortid.generate();
      const file_path = `${path_save_folder}/${doc_id}.pdf`;
      fs.writeFile(file_path, base64, 'base64', (err) => {
        if (err)
          reject(err);
        else
          resolve({ file_path, doc_id })
      })
    });
  }
  file_remove(file_path) {
    fs.unlink(file_path, (err) => {
      if (err)
        console.log("ERROR DELETING FILE", err)
    })
  }
  _exec(script) {
    return new Promise((resolve, reject) => {
      shell.exec(script, (code, stdout, stderr) => {
        if (code == 0) {
          resolve({data: stdout, exitCode: code });
        }
        else {
          reject({error: stderr, exitCode: code });
        }
      });
    })
  }
  async exec(script) {
    if (typeof script == 'string') {
      return await this._exec(script);
    }
    else if (typeof script == 'object') {
      let error;
      // EXECUTE THE ARRAY OF SCRIPTS
      for (let i = 0; i < script.length; i++) {
        try {
          await this._exec(script[i]);
        }
        catch(err) {
          // CATCH ANY ERRORS MANUALLY TO PREVENT INTERRUPTING PRINTING
          error = err;
        }
      }
      // THROW THE ERROR AFTER ATTEMPTING TO PRINT TO ALL PRINTERS
      if (error)
        throw error;
      return true;
    }
  }

}