import { createJsonStore } from "../platform/json-store.js";
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

function readAllCases() {
  return caseStore.read();
}

export function listCases(tenantId) {
  return readAllCases()
    .filter((item) => !tenantId || item.tenantId === tenantId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getCaseById(caseId, tenantId) {
  return readAllCases().find((item) => item.caseId === caseId && (!tenantId || item.tenantId === tenantId)) || null;
}

export function saveCase(caseRecord) {
  return caseStore.upsert((item) => item.caseId === caseRecord.caseId, caseRecord);
}

export function nextCaseId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `case-${stamp}-${randomSuffix}`;
}
