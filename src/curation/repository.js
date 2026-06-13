import fs from "node:fs";
import path from "node:path";

const dataRoot = path.resolve(process.cwd(), "data", "app");
const curationPath = path.join(dataRoot, "curation.json");

function ensureStore() {
  fs.mkdirSync(dataRoot, { recursive: true });

  if (!fs.existsSync(curationPath)) {
    fs.writeFileSync(curationPath, "[]", "utf8");
  }
}

function readAllRecords() {
  ensureStore();
  return JSON.parse(fs.readFileSync(curationPath, "utf8"));
}

function writeAllRecords(records) {
  ensureStore();
  fs.writeFileSync(curationPath, JSON.stringify(records, null, 2), "utf8");
}

export function listCurationReviews(tenantId) {
  return readAllRecords().filter((record) => !tenantId || record.tenantId === tenantId);
}

export function getCurationReview(itemId, tenantId) {
  return readAllRecords().find((record) => record.itemId === itemId && (!tenantId || record.tenantId === tenantId)) || null;
}

export function saveCurationReview(review) {
  const records = readAllRecords();
  const index = records.findIndex((record) => record.itemId === review.itemId && record.tenantId === review.tenantId);

  if (index === -1) {
    records.push(review);
  } else {
    records[index] = review;
  }

  writeAllRecords(records);
  return review;
}
