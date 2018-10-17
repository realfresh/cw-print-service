export declare const CacheCreator: (directory: string) => {
    set(key: string, data: string | object): void;
    get(key: string): object;
    del(key: string): void;
    clear(): void;
    all(): any;
};
