import fs from "node:fs";
import path from "node:path";

export function createJsonStore(relativePath, { fallback = [], migrate = null } = {}) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const directory = path.dirname(absolutePath);

  function ensureStore() {
    fs.mkdirSync(directory, { recursive: true });

    if (!fs.existsSync(absolutePath)) {
      fs.writeFileSync(absolutePath, JSON.stringify(fallback, null, 2), "utf8");
    }
  }

  function read() {
    ensureStore();
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    return typeof migrate === "function" ? parsed.map(migrate) : parsed;
  }

  function write(value) {
    ensureStore();
    fs.writeFileSync(absolutePath, JSON.stringify(value, null, 2), "utf8");
  }

  function upsert(matchFn, nextRecord) {
    const records = read();
    const index = records.findIndex(matchFn);

    if (index === -1) {
      records.push(nextRecord);
    } else {
      records[index] = nextRecord;
    }

    write(records);
    return nextRecord;
  }

  return {
    path: absolutePath,
    read,
    write,
    upsert
  };
}
