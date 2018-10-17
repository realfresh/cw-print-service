import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

export const CacheCreator = (directory: string) => {

  const adapter = new FileSync(directory);
  const db = low(adapter);

  return {
    set(key: string, data: string | object) {
      db.set(key, data).write();
    },
    get(key: string): object {
      return db.get(key).value();
    },
    del(key: string) {
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
