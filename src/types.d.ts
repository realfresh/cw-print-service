import {CacheCreator} from "./cache";

export type AppServiceEvents = "updates" | "updates_status" | "print_job" | "error";
export type OperatingSystem = "windows" | "linux";

export interface AppServiceOptions {
  os: OperatingSystem;
  copies: number;
  paths: {
    gm: string;
    print_cli: string;
    save: string;
  };
  api: {
    ably_auth: string;
    receipt_image: string;
    receipt_pdf: string;
  };
}

export interface PrintServiceOptions {
  os: OperatingSystem;
  save_folder: string;
  cache: ReturnType<typeof CacheCreator>;
  gm: string;
  print_cli: string;
}

export interface AppHandlePrinterJobOptions {
  data: {
    job_id: string;
    query: object;
    notify_restaurant_dashboard: boolean;
    error?: any;
  };
}

export interface PrintServicePrintWindowsOpts {
  job_id: string;
  copies: number;
  base64: string;
  printers: string[];
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export interface PrintServicePrintLinuxOpts {
  job_id: string;
  copies: number;
  base64: string;
  printers: string[];
}
