import Ably from "ably";
import { PrintService } from "./printer";
import { CacheCreator } from "./cache";
import { AppServiceEvents, AppServiceOptions } from "./types";
export declare class AppService {
    os: "windows" | "linux";
    api: AppServiceOptions["api"];
    copies: number;
    cache: ReturnType<typeof CacheCreator>;
    state: Ably.Types.ConnectionState;
    printers: string[];
    printer: PrintService;
    api_key?: string;
    id?: {
        print_config: string;
        restaurant: string;
        api_key: string;
    };
    private job_number;
    private ably?;
    private connected_once?;
    private channels?;
    private readonly callbacks;
    constructor(opts: AppServiceOptions);
    start(): void;
    stop(): void;
    set_config(opts: {
        printers?: string[];
        api_key?: string;
        copies?: number;
    }): void;
    set_state(state: Ably.Types.ConnectionState): void;
    on(event: AppServiceEvents, fn: (data: any) => void): void;
    private onCallback;
    private handle_print_job;
    private handle_print_job_history;
    private publish_restaurant_update;
    private publish_server_update;
    private handle_error;
    private api_get_job_pdf;
    private api_get_job_image;
}
