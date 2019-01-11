"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lowdb_1 = tslib_1.__importDefault(require("lowdb"));
const FileSync_1 = tslib_1.__importDefault(require("lowdb/adapters/FileSync"));
exports.CacheCreator = (directory) => {
    const adapter = new FileSync_1.default(directory);
    const db = lowdb_1.default(adapter);
    return {
        set(key, data) {
            db.set(key, data).write();
        },
        get(key) {
            return db.get(key).value();
        },
        del(key) {
            db.unset(key).write();
        },
        clear() {
            db.setState({});
        },
        all() {
            return db.getState();
        },
    };
};
//# sourceMappingURL=cache.js.map