import * as Sentry from "@sentry/node";
import axios from "axios";
import Ably from "ably";
import { PrintService } from "./printer";
import { CacheCreator } from "./cache";
import { logger } from "../libs/common/utils/logger";
import { AppHandlePrinterJobOptions, AppServiceEvents, AppServiceOptions } from "./types";
import debug from "debug";
const autobind = require("class-autobind").default;
const exitHook = require("async-exit-hook");

const log = debug("PRINT-SERVICE");

Sentry.init({
  dsn: "https://e4f36acab6234be194caa966e4b2c9c4@sentry.io/1302660",
  enabled: process.env.NODE_ENV === "production",
});

export class AppService {

  public os: "windows" | "linux";
  public api: AppServiceOptions["api"];
  public copies: number;
  public cache: ReturnType<typeof CacheCreator>;
  public state: Ably.Types.ConnectionState;

  public printers: string[];
  public printer: PrintService;

  public api_key?: string;
  public id?: {
    print_config: string;
    restaurant: string;
    api_key: string;
  };

  private job_number: number;
  private ably?: Ably.Realtime;
  private connected_once?: boolean;
  private channels?: {
    all_printers: Ably.Types.RealtimeChannel;
    receive_jobs: Ably.Types.RealtimeChannel;
    update_restaurant: Ably.Types.RealtimeChannel;
    update_server: Ably.Types.RealtimeChannel;
  };
  private readonly callbacks: {[key: string]: (data: any) => void};

  constructor(opts: AppServiceOptions) {
    log(typeof autobind);
    autobind(this);
    this.os = opts.os;
    this.api = opts.api;
    this.copies = opts.copies || 1;
    this.cache = CacheCreator(`${opts.paths.save}/temp-db.json`);
    this.state = "disconnected";
    this.callbacks = {};
    this.job_number = 1;
    this.printers = [];
    this.printer = new PrintService({
      os: this.os,
      cache: this.cache,
      gm: opts.paths.gm,
      save_folder: opts.paths.save,
    });
    exitHook(this.stop);
    log("INITIALIZED");
  }

  public start() {
    log("SERVICE STARTED");
    const { api_key, api, id } = this;

    if (!api_key || !id) {
      logger.captureWarning("Missing api key and ID when starting");
      return;
    }

    if (this.ably) {
      this.ably.close();
      delete this.ably;
    }

    // CONNECT TO ABLY BY AUTHING TO SERVER
    this.ably = new Ably.Realtime({
      authCallback: (tokenParams, callback) => {
        const opts = {
          headers: {
            Authorization: `Bearer ${api_key}`,
          },
        };
        axios.get(api.ably_auth, opts)
          .then(({data}) => callback("", data))
          .catch( (e) => {
            if (e.response && e.response.data === "token-error") {
              this.onCallback("updates", "token-error");
              this.stop();
            }
            else {
              logger.captureException(e);
              this.onCallback("updates", "auth-error");
            }
            callback(e, "");
          });
      },
      recover: (lastConnectionDetails, cb) => {
        log(lastConnectionDetails);
        cb(true);
      },
    });

    // LISTEN TO CONNECTION STATE CHANGES
    this.ably.connection.on((stateChange) => {
      log("STATE CHANGE: " + stateChange.current);
      this.set_state(stateChange.current);
    });
    this.ably.connection.on("connected", () => {
      if (this.connected_once && this.channels) {
        this.channels.all_printers.presence.enter();
        this.channels.update_restaurant.presence.enter({ type: "printer" });
        this.channels.receive_jobs.history(this.handle_print_job_history);
      }
      this.connected_once = true;
    });

    // GENERIC PRINTERS CHANNEL
    this.channels = {
      all_printers: this.ably.channels.get(`private:printing-clients`),
      receive_jobs: this.ably.channels.get(`private:printing-client:${api_key}`),
      update_server: this.ably.channels.get(`private:printing-clients:jobs`),
      update_restaurant: this.ably.channels.get(`private:restaurant:${id.restaurant}`),
    };

    this.channels.all_printers.presence.enter();

    // RECEIVE PRINT JOBS
    this.channels.receive_jobs.subscribe("new-job", this.handle_print_job);
    this.channels.receive_jobs.history(this.handle_print_job_history);

    // SEND UPDATES TO SERVER AND CLIENT
    this.channels.update_restaurant.presence.enter({ type: "printer" });

    this.job_number = 1;

    this.onCallback("updates", "started");
  }
  public stop() {
    if (this.ably && this.ably.close) {
      this.ably.close();
      if (this.channels) {
        this.channels.all_printers.presence.leave();
        this.channels.update_restaurant.presence.leave();
      }
      setTimeout(() => {
        delete this.ably;
        this.onCallback("updates", "stopped");
      }, 200);
    }
    this.connected_once = false;
  }
  public set_config(opts: { printers?: string[]; api_key?: string; copies?: number }) {

    if (opts.api_key) {
      const api_key_parts = opts.api_key.split("|");
      this.api_key = opts.api_key;
      this.id = {
        restaurant: api_key_parts[0],
        print_config: api_key_parts[1],
        api_key: api_key_parts[2],
      };
      log(this.id);
    }

    if (opts.printers) {
      this.printers = opts.printers.filter( (p) => !!p );
    }

    if (opts.copies) {
      this.copies = opts.copies;
    }

    log("SET CONFIG SERVICE");

  }
  public set_state(state: Ably.Types.ConnectionState) {
    this.state = state;
    this.onCallback("updates_status", state);
  }

  // EVENTS
  public on(event: AppServiceEvents, fn: (data: any) => void) {
    this.callbacks[`event_callback_${event}`] = fn;
  }
  private onCallback(event: AppServiceEvents, data: any) {
    const fn = this.callbacks[`event_callback_${event}`] || (() => {});
    fn(data);
  }

  // HANDLERS
  private async handle_print_job(message: AppHandlePrinterJobOptions, fromHistory?: boolean) {
    // LOG
    log(`${this.job_number} - PRINT JOB RECEIVED`, message.data);
    this.onCallback("print_job", { event: "received", data: message.data });

    // INCREMENT JOB NUMBER
    this.job_number++;

    // PARSE DATA
    const data = message.data || {};
    const { job_id, query, notify_restaurant_dashboard } = data;

    try {
      // GET BASE64 PDF
      if (this.os === "windows") {
        const queryData = await this.api_get_job_image(query);
        const { base64, width, height, deviceScaleFactor } = queryData;
        log("BASE64 IMAGE FETCHED", width, height);
        await this.printer.print_windows({
          job_id: job_id,
          copies: this.copies,
          printers: this.printers,
          base64: base64,
          width: width,
          height: height,
          deviceScaleFactor: deviceScaleFactor,
        });
      }
      else {
        const queryData = await this.api_get_job_pdf(query);
        const { base64, width, height } = queryData;
        log("BASE64 PDF FETCHED", width, height);
        await this.printer.print_linux({
          copies: this.copies,
          printers: this.printers,
          base64: base64,
          job_id: job_id,
        });
      }

      log("PRINT JOB COMPLETE");

      // NOTIFY DASHBOARD IF REQUIRED
      if (notify_restaurant_dashboard)
        this.publish_restaurant_update(data);

      // UPDATE SERVER OF JOB SUCCESS
      this.publish_server_update(data);

      // LOG
      this.onCallback("print_job", { event: "success", data: message.data });
    }
    catch (e) {
      logger.error("PRINT ERROR");
      logger.captureException(e.response ? e.response : e);
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
  private handle_print_job_history(e: any, resultPage: any) {
    if (e) {
      logger.captureException(e);
    }
    else {
      resultPage.items.forEach((message: any) => {
        this.handle_print_job(message, true);
      });
      if (resultPage.hasNext()) {
        resultPage.next(this.handle_print_job_history);
      }
    }
  }

  // PUBLISHERS
  private publish_restaurant_update(messageData: any) {
    log("NOTIFY RESTAURANT");
    if (this.channels)
      this.channels.update_restaurant.publish("printer:job-update", messageData, this.handle_error);
  }
  private publish_server_update(messageData: any) {
    log("NOTIFY SERVER");
    if (this.channels)
      this.channels.update_server.publish("update", messageData, this.handle_error);
  }

  private handle_error(err: any) {
    if (err) {
      logger.captureException(err);
      this.onCallback("error", err);
    }
  }

  // API
  private async api_get_job_pdf(query: any): Promise<APIPrintingClientOrderToPDFResponse> {
    const { api_key, api } = this;
    const options = {
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    };
    const res = await axios.post(api.receipt_pdf, { query }, options);
    return res.data;
  }
  private async api_get_job_image(query: any): Promise<APIPrintingClientOrderToImageResponse> {
    const { api_key, api } = this;
    const options = {
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    };
    const res = await axios.post(api.receipt_image, { query }, options);
    return res.data;
  }

}
