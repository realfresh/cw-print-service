import fs from "fs";
import { CacheCreator } from "../src/cache";

describe("CACHE TEST", () => {

  const cache = CacheCreator(__dirname + "/db.json");

  test(`CACHE EXISTS`, () => {
    const exists = fs.existsSync(__dirname + "/db.json");
    expect(exists).toBe(true);
  });

  test(`CACHE WRITE`, () => {
    expect(() => {
      cache.set("test", "ass");
    }).not.toThrowError();
  });

  test(`CACHE READ`, () => {
    const value = cache.get("test");
    expect(value).toBe("ass");
  });

});
