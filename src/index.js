import { consoleLog } from './utils';
import PrintService from './printer';
import autobind from 'class-autobind';

const axios = require('axios');
const exitHook = require('async-exit-hook');
const Ably = require('ably');

export default class AppService {

  constructor(opts) {
    autobind(this);
    this.init(opts);
    this.state = "disconnected";
    exitHook(this.stop);
    consoleLog("INITIALIZED");
  }

  init(opts) {
    // SET OPTIONS
    this.api_url_base_64 = opts.api_url_base_64;
    this.api_url_ably_auth = opts.api_url_ably_auth;
    this.path_save_folder = opts.path_save_folder;
    this.operating_system = opts.operating_system;
    this.printer = new PrintService({
      // path_ghostscript: opts.path_ghostscript,
      path_save_folder: opts.path_save_folder,
      operating_system: opts.operating_system,
      number_of_copies: opts.number_of_copies || 1,
    });
    this.printers = [];
    this.set_config(opts); // GHOSTSCRIPT SET HERE
  }

  start() {
    consoleLog("STARTED");

    const { api_key, api_url_ably_auth, r_id } = this;

    if (this.ably) {
      this.ably.close();
      delete this.ably;
    }

    // CONNECT TO ABLY BY AUTHING TO SERVER
    this.ably = new Ably.Realtime({
      authCallback: (tokenParams, callback) => {
        const opts = {
          headers: {
            'Authorization': `Bearer ${api_key}`
          }
        };
        axios.get(api_url_ably_auth, opts)
          .then(({data}) => callback(null, data))
          .catch( e => {
            if (e.response && e.response.data == "token-error") {
              this.onCallback("updates", "token-error");
              this.stop();
            }
            else {
              console.log(e);
              this.onCallback("updates", "auth-error");
            }
            callback(e);
          });
      },
      recover: (lastConnectionDetails, cb) => {
        console.log(lastConnectionDetails);
        cb(true);
      }
    });

    // LISTEN TO CONNECTION STATE CHANGES
    this.ably.connection.on((stateChange) => {
      consoleLog('STATE CHANGE: ' + stateChange.current);
      this.set_state(stateChange.current);
    });

    this.ably.connection.on('connected', () => {
      if (this.connected_once) {
        this.channel_all_printers.presence.enter();
        this.channel_update_restaurant.presence.enter({ type: 'printer' });
        this.channel_receive_jobs.history(this.handle_print_job_history);
      }
      this.connected_once = true;
    });

    // GENERIC PRINTERS CHANNEL
    this.channel_all_printers = this.ably.channels.get(`private:printing-clients`);
    this.channel_all_printers.presence.enter();

    // RECEIVE PRINT JOBS
    this.channel_receive_jobs = this.ably.channels.get(`private:printing-client:${api_key}`);
    this.channel_receive_jobs.subscribe("new-job", this.handle_print_job);
    this.channel_receive_jobs.history(this.handle_print_job_history);

    // SEND UPDATES TO SERVER AND CLIENT
    this.channel_update_server = this.ably.channels.get(`private:printing-clients:jobs`);
    this.channel_update_restaurant = this.ably.channels.get(`private:restaurant:${r_id}`);
    this.channel_update_restaurant.presence.enter({ type: 'printer' });

    this.job_number = 1;
    
    this.onCallback("updates", "started");
  }

  stop() {
    if (this.ably && this.ably.close) {
      this.ably.close();
      this.channel_all_printers.presence.leave();
      this.channel_update_restaurant.presence.leave();
      delete this.ably;
      setTimeout(() => {
        this.onCallback("updates", "stopped");
      }, 200);
    }
    this.connected_once = false;
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
  async handle_print_job(message, fromHistory=false) {

    // LOG
    console.log(`${this.job_number} - PRINT JOB RECEIVED`, message.data);
    this.onCallback("print_job", { event: "received", data: message.data });

    // INCREMENT JOB NUMBER
    this.job_number++;

    // PARSE DATA
    const data = message.data || {};
    const { job_id, query, notify_restaurant_dashboard } = data;

    try {
      // GET BASE64 PDF
      const { base64 } = await this.api_get_job_pdf(query);

      console.log("BASE64 FETCHED");

      // SUBMIT PRINT JOB TO SERVICE
      await this.printer.create_print_job({
        printers: this.printers,
        base64: base64,
        job_id: job_id,
      });

      console.log("PRINT JOB COMPLETE");

      // NOTIFY DASHBOARD IF REQUIRED
      if (notify_restaurant_dashboard)
        this.publish_restaurant_update(data);

      // UPDATE SERVER OF JOB SUCCESS
      this.publish_server_update(data);

      // LOG
      this.onCallback("print_job", { event: "success", data: message.data });
    }
    catch(e) {
      console.log("PRINT ERROR");
      console.log(e.response ? e.response : e);
      data.error = true;

      // NOTIFY DASHBOARD OF ERROR
      if (notify_restaurant_dashboard)
        this.publish_restaurant_update(data);

      // NOTIFY SERVER
      this.publish_server_update(data);

      // LOG
      this.onCallback("print_job", { event: "error", data: e });
      this.onCallback("error", e);
    }
  }
  handle_print_job_history(e, resultPage) {
    if (e)
      console.log(e);
    else {
      resultPage.items.forEach( message => {
        this.handle_print_job(message, true);
      });
      if(resultPage.hasNext()) {
        resultPage.next(this.handle_print_job_history);
      }
    }
  }

  // PUBLISHERS
  publish_restaurant_update(messageData) {
    consoleLog("NOTIFY RESTAURANT");
    this.channel_update_restaurant.publish("printer:job-update", messageData, err => {
      if (err) {
        console.log(err);
        this.onCallback("error", err);
      }
    })
  }
  publish_server_update(messageData) {
    consoleLog("NOTIFY SERVER");
    this.channel_update_server.publish("update", messageData, err => {
      if (err) {
        console.log(err);
        this.onCallback("error", err);
      }
    })
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
  set_config({ printers, api_key, ghostscript_path, number_of_copies }) {
    if (api_key) {
      this.api_key = api_key;
      const api_key_parts = api_key.split("|");
      this.r_id = api_key_parts[0];
      this.r_print_config_id = api_key_parts[1];
      this.r_api_key = api_key_parts[1];
    }
    if (printers) {
      this.printers = printers.filter( p => !!p );
    }
    if (ghostscript_path) {
      this.path_ghostscript = ghostscript_path;
      this.printer.path_ghostscript = ghostscript_path;
    }
    if (number_of_copies) {
      this.printer.number_of_copies = number_of_copies || 1;
    }
    console.log("SET CONFIG SERVICE", printers, api_key, number_of_copies);
  }
  set_state(state) {
    this.state = state;
    this.onCallback('updates_status', state);
  }

}

