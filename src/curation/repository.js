import { createJsonStore } from "../platform/json-store.js";
import { isSupabaseEnabled, selectRows, upsertRows } from "../platform/supabase-client.js";

const curationStore = createJsonStore("data/app/curation.json", {
  fallback: []
});

async function readAllRecords() {
  if (!isSupabaseEnabled()) {
    return curationStore.read();
  }

  return selectRows("app_curation_reviews");
}

function mapSupabaseReview(row) {
  return {
    itemId: row.item_id,
    tenantId: row.tenant_id,
    status: row.status,
    disposition: row.disposition,
    note: row.note,
    correctedValue: row.corrected_value,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by
  };
}

export async function listCurationReviews(tenantId) {
  if (!isSupabaseEnabled()) {
    return (await readAllRecords()).filter((record) => !tenantId || record.tenantId === tenantId);
  }

  const filters = tenantId ? { tenant_id: `eq.${tenantId}` } : {};
  const rows = await selectRows("app_curation_reviews", { filters });
  return rows.map(mapSupabaseReview);
}

export async function getCurationReview(itemId, tenantId) {
  return (await listCurationReviews(tenantId)).find((record) => record.itemId === itemId) || null;
}

export async function saveCurationReview(review) {
  if (!isSupabaseEnabled()) {
    return curationStore.upsert(
      (record) => record.itemId === review.itemId && record.tenantId === review.tenantId,
      review
    );
  }

  await upsertRows("app_curation_reviews", [{
    item_id: review.itemId,
    tenant_id: review.tenantId,
    status: review.status,
    disposition: review.disposition,
    note: review.note,
    corrected_value: review.correctedValue,
    reviewed_at: review.reviewedAt,
    reviewed_by: review.reviewedBy
  }], {
    onConflict: "item_id,tenant_id"
  });

  return review;
}
