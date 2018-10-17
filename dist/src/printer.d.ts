import { CacheCreator } from "./cache";
import { PrintServicePrintLinuxOpts, PrintServicePrintWindowsOpts, PrintServiceOptions } from "./types";
export declare class PrintService {
    print_cli: string;
    save_folder: string;
    cache: ReturnType<typeof CacheCreator>;
    constructor(opts: PrintServiceOptions);
    print_windows(data: PrintServicePrintWindowsOpts): Promise<void>;
    print_linux(data: PrintServicePrintLinuxOpts): Promise<void>;
    private print_job_valid;
    private image_split_n_save_sharp;
    private file_save;
    private file_remove;
    private _exec;
    private exec;
}
