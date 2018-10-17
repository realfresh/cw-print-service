import debug from "debug";
export declare const logger: {
    captureWarning: (message: string, e?: any) => void;
    captureException: (e: any, message?: string | undefined) => void;
    error: debug.IDebugger;
    warn: debug.IDebugger;
    info: debug.IDebugger;
    dev: debug.IDebugger;
};
