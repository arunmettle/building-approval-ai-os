import { createJsonStore } from "../platform/json-store.js";
import { isSupabaseEnabled, selectRows, upsertRows } from "../platform/supabase-client.js";

const legacyTenantId = "tenant-sunrise-installers";

function migrateLegacyCase(caseRecord) {
  return {
    ...caseRecord,
    tenantId: caseRecord.tenantId || legacyTenantId,
    createdBy: caseRecord.createdBy || null,
    workflowHistory: Array.isArray(caseRecord.workflowHistory) ? caseRecord.workflowHistory : []
  };
}

const caseStore = createJsonStore("data/app/cases.json", {
  fallback: [],
  migrate: migrateLegacyCase
});

async function readAllCases() {
  if (!isSupabaseEnabled()) {
    return caseStore.read();
  }

  const rows = await selectRows("app_cases", {
    columns: "payload",
    order: "updated_at.desc"
  });

  return rows.map((row) => migrateLegacyCase(row.payload));
}

export async function listCases(tenantId) {
  return (await readAllCases())
    .filter((item) => !tenantId || item.tenantId === tenantId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getCaseById(caseId, tenantId) {
  if (!isSupabaseEnabled()) {
    return (await readAllCases()).find((item) => item.caseId === caseId && (!tenantId || item.tenantId === tenantId)) || null;
  }

  const filters = {
    case_id: `eq.${caseId}`
  };

  if (tenantId) {
    filters.tenant_id = `eq.${tenantId}`;
  }

  const rows = await selectRows("app_cases", {
    columns: "payload",
    filters,
    limit: 1
  });

  return rows[0] ? migrateLegacyCase(rows[0].payload) : null;
}

export async function saveCase(caseRecord) {
  if (!isSupabaseEnabled()) {
    return caseStore.upsert((item) => item.caseId === caseRecord.caseId, caseRecord);
  }

  await upsertRows("app_cases", [{
    case_id: caseRecord.caseId,
    tenant_id: caseRecord.tenantId,
    project_type: caseRecord.projectType,
    jurisdiction_id: caseRecord.jurisdictionId,
    address: caseRecord.address,
    risk_rating: caseRecord.riskRating,
    pathway_label: caseRecord.pathwayLabel,
    assigned_reviewer_id: caseRecord.assignedReviewerId || null,
    assigned_reviewer: caseRecord.assignedReviewer || null,
    created_at: caseRecord.createdAt,
    updated_at: caseRecord.updatedAt,
    payload: caseRecord
  }], {
    onConflict: "case_id"
  });

  return caseRecord;
}

export function nextCaseId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `case-${stamp}-${randomSuffix}`;
}
