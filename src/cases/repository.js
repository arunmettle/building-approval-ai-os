import fs from "node:fs";
import path from "node:path";

const dataRoot = path.resolve(process.cwd(), "data", "app");
const casesPath = path.join(dataRoot, "cases.json");
const legacyTenantId = "tenant-sunrise-installers";

function migrateLegacyCase(caseRecord) {
  return {
    ...caseRecord,
    tenantId: caseRecord.tenantId || legacyTenantId,
    createdBy: caseRecord.createdBy || null,
    workflowHistory: Array.isArray(caseRecord.workflowHistory) ? caseRecord.workflowHistory : []
  };
}

function ensureStore() {
  fs.mkdirSync(dataRoot, { recursive: true });

  if (!fs.existsSync(casesPath)) {
    fs.writeFileSync(casesPath, "[]", "utf8");
  }
}

function readAllCases() {
  ensureStore();
  return JSON.parse(fs.readFileSync(casesPath, "utf8")).map(migrateLegacyCase);
}

function writeAllCases(cases) {
  ensureStore();
  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), "utf8");
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
  const cases = readAllCases();
  const index = cases.findIndex((item) => item.caseId === caseRecord.caseId);

  if (index === -1) {
    cases.push(caseRecord);
  } else {
    cases[index] = caseRecord;
  }

  writeAllCases(cases);
  return caseRecord;
}

export function nextCaseId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `case-${stamp}-${randomSuffix}`;
}
