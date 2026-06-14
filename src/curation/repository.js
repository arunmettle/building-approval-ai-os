import { createJsonStore } from "../platform/json-store.js";

const curationStore = createJsonStore("data/app/curation.json", {
  fallback: []
});

function readAllRecords() {
  return curationStore.read();
}

export function listCurationReviews(tenantId) {
  return readAllRecords().filter((record) => !tenantId || record.tenantId === tenantId);
}

export function getCurationReview(itemId, tenantId) {
  return readAllRecords().find((record) => record.itemId === itemId && (!tenantId || record.tenantId === tenantId)) || null;
}

export function saveCurationReview(review) {
  return curationStore.upsert(
    (record) => record.itemId === review.itemId && record.tenantId === review.tenantId,
    review
  );
}
