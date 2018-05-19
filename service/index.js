import autobind from 'class-autobind';
import axios from 'axios';
import PrintService from './printer';
import { consoleLog } from './utils';
const exitHook = require('async-exit-hook');
const Ably = require('ably');

export default class AppService {

  constructor(opts) {
    autobind(this);
    // SET OPTIONS
    this.api_key = opts.api_key;
    this.api_url_base_64 = opts.api_url_base_64;
    this.api_url_ably_auth = opts.api_url_ably_auth;
    this.path_ghostscript = opts.path_ghostscript;
    this.path_save_folder = opts.path_save_folder;
    this.operating_system = opts.operating_system;

    // BREAK DOWN API KEY
    const api_key_parts = this.api_key.split("|");
    this.r_id = api_key_parts[0];
    this.r_print_config_id = api_key_parts[1];
    this.r_api_key = api_key_parts[1];

    // CREATE PRINTER SERVICE
    this.printers = [];
    this.printer = new PrintService({
      path_ghostscript: this.path_ghostscript,
      path_save_folder: this.path_save_folder,
      operating_system: this.operating_system,
    });

    // SHUTDOWN ABLY PROPERLY
    exitHook(() => {
      if (this.ably && this.ably.close) {
        this.ably.close();
        this.channel_all_printers.presence.leave();
        this.channel_update_restaurant.presence.leave();
      }
    });

    consoleLog("INITIALIZED");
  }

  // START SERVICE AND ATTACH HANDLERS
  start() {
    consoleLog("STARTED");

    const {
      api_key,
      api_url_ably_auth,
      r_id,
    } = this;

    // CONNECT TO ABLY BY AUTHING TO SERVER
    this.ably = new Ably.Realtime({
      authUrl: api_url_ably_auth,
      authHeaders: {
        'Authorization': `Bearer ${api_key}`
      },
      recover: (lastConnectionDetails, cb) => {
        console.log(lastConnectionDetails);
        cb(true);
      }
    });

    // LISTEN TO CONNECTION STATE CHANGES
    this.ably.connection.on((stateChange) => {
      consoleLog('STATE CHANGE: ' + stateChange.current);
      this.onCallback('stateChange', stateChange);
    });
    this.ably.connection.on('connecting', () => {
      if (this.connected_once) {

      }
    });
    this.ably.connection.on('connected', () => {
      this.connected_once = true;
      if (this.connected_once) {
        this.channel_all_printers.presence.enter();
        this.channel_update_restaurant.presence.enter({ type: 'printer' });
      }
    });
    this.ably.connection.on('disconnected', (...args) => {

    });
    this.ably.connection.on('failed', (...args) => {

    });

    // GENERIC PRINTERS CHANNEL
    this.channel_all_printers = this.ably.channels.get(`private:printing-clients`);
    this.channel_all_printers.presence.enter();

    // RECEIVE PRINT JOBS
    this.channel_receive_jobs = this.ably.channels.get(`private:printing-client:${api_key}`);
    this.channel_receive_jobs.attach( e => {
      if (e)
        console.log(e);
      else
        this.channel_receive_jobs.history({ untilAttach: true }, this.handle_print_job_history);
    });
    this.channel_receive_jobs.subscribe("new-job", this.handle_print_job);

    // SEND UPDATES TO SERVER AND CLIENT
    this.channel_update_server = this.ably.channels.get(`private:printing-clients:jobs`);
    this.channel_update_restaurant = this.ably.channels.get(`private:restaurant:${r_id}`);
    this.channel_update_restaurant.presence.enter({ type: 'printer' });

    this.job_number = 1;

  }

  // STOP AND CLOSE CONNECTION
  stop() {
    this.ably.close();
    this.channel_all_printers.presence.leave();
    this.channel_update_restaurant.presence.leave();
    setTimeout(() => {
      delete this.ably;
    }, 1000)
  }

  // EVENTS
  on(event, fn) {
    this[`event_callback_${event}`] = fn;
  }
  onCallback(event, data) {
    const fn = this[`event_callback_${event}`] || (() => {});
    fn(data);
  }

  // HANDLERS
  async handle_print_job(message) {
    console.log(`${this.job_number} - PRINT JOB RECEIVED`, message.data);
    this.job_number++;
    const data = message.data || {};
    const { job_id, query, notify_restaurant_dashboard } = data;
    try {
      const { base64 } = await this.api_get_job_pdf(query);
      await this.printer.create_print_job({
        printers: this.printers,
        base64: base64,
        job_id: job_id,
      });
      if (notify_restaurant_dashboard)
        this.publish_restaurant_update(data);
      this.publish_server_update(data)
    }
    catch(e) {
      console.log("PRINT ERROR", e.response ? e.response : e);
      // FLAG ERROR & UPDATE CLIENTS
      data.error = true;
      if (notify_restaurant_dashboard)
        this.publish_restaurant_update(data);
      this.publish_server_update(data);
    }
  }
  handle_print_job_history(e, resultPage) {
    if (e)
      console.log(e);
    else {
      resultPage.items.forEach( message => {
        this.handle_print_job(message);
      });
      if(resultPage.hasNext()) {
        resultPage.next(this.handle_print_job_history);
      }
    }
  }

  // PUBLISHERS
  publish_restaurant_update(messageData) {
    consoleLog("NOTIFY RESTAURANT");
    this.channel_update_restaurant.publish("printer:job-update", messageData)
  }
  publish_server_update(messageData) {
    consoleLog("NOTIFY SERVER");
    this.channel_update_server.publish("update", messageData)
  }

  // API
  async api_get_job_pdf(query) {
    const { api_key, api_url_base_64 } = this;
    const options = {
      headers: {
        'Authorization': `Bearer ${api_key}`
      },
    };
    const res = await axios.post(api_url_base_64, { query }, options);
    return res.data;
  }

  // SETTERS & UTILS
  set_printers(printers) {
    this.printers = printers;
  }

}

