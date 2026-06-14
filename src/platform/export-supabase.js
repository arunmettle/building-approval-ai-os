import fs from "node:fs";
import path from "node:path";
import { operators as seededOperators } from "../auth/operators.js";

function readJson(relativePath, fallback) {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function sqlString(value) {
  if (value === null || typeof value === "undefined") {
    return "null";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  if (value === null || typeof value === "undefined") {
    return "null";
  }

  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function uniqueTenants(operators, cases, curation) {
  const byId = new Map();

  for (const operator of operators) {
    byId.set(operator.tenantId, {
      tenantId: operator.tenantId,
      tenantName: operator.tenantName || operator.tenantId
    });
  }

  for (const caseRecord of cases) {
    if (!byId.has(caseRecord.tenantId)) {
      byId.set(caseRecord.tenantId, {
        tenantId: caseRecord.tenantId,
        tenantName: caseRecord.tenantId
      });
    }
  }

  for (const review of curation) {
    if (!byId.has(review.tenantId)) {
      byId.set(review.tenantId, {
        tenantId: review.tenantId,
        tenantName: review.tenantId
      });
    }
  }

  return [...byId.values()];
}

function buildInsert(tableName, columns, rows) {
  if (!rows.length) {
    return `-- No rows for ${tableName}\n`;
  }

  return [
    `insert into ${tableName} (${columns.join(", ")}) values`,
    rows.map((row) => `  (${row.join(", ")})`).join(",\n"),
    "on conflict do nothing;",
    ""
  ].join("\n");
}

function ensureOutputDir(outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sessions = readJson("data/app/sessions.json", []);
const cases = readJson("data/app/cases.json", []);
const curation = readJson("data/app/curation.json", []);
const tenants = uniqueTenants(seededOperators, cases, curation);

const statements = [];
statements.push("-- Generated Supabase seed export");
statements.push(`-- Exported at ${new Date().toISOString()}`);
statements.push("");

statements.push(buildInsert(
  "app_tenants",
  ["tenant_id", "tenant_name"],
  tenants.map((tenant) => [sqlString(tenant.tenantId), sqlString(tenant.tenantName)])
));

statements.push(buildInsert(
  "app_operators",
  ["operator_id", "tenant_id", "email", "display_name", "role", "access_code"],
  seededOperators.map((operator) => [
    sqlString(operator.operatorId),
    sqlString(operator.tenantId),
    sqlString(operator.email),
    sqlString(operator.displayName),
    sqlString(operator.role),
    sqlString(operator.accessCode)
  ])
));

statements.push(buildInsert(
  "app_sessions",
  ["token", "operator_id", "tenant_id", "created_at", "last_seen_at"],
  sessions.map((session) => [
    sqlString(session.token),
    sqlString(session.operatorId),
    sqlString(session.tenantId),
    sqlString(session.createdAt),
    sqlString(session.lastSeenAt)
  ])
));

statements.push(buildInsert(
  "app_cases",
  ["case_id", "tenant_id", "project_type", "jurisdiction_id", "address", "risk_rating", "pathway_label", "assigned_reviewer_id", "assigned_reviewer", "created_at", "updated_at", "payload"],
  cases.map((caseRecord) => [
    sqlString(caseRecord.caseId),
    sqlString(caseRecord.tenantId),
    sqlString(caseRecord.projectType),
    sqlString(caseRecord.jurisdictionId),
    sqlString(caseRecord.address),
    sqlString(caseRecord.riskRating),
    sqlString(caseRecord.pathwayLabel),
    sqlString(caseRecord.assignedReviewerId || null),
    sqlString(caseRecord.assignedReviewer || null),
    sqlString(caseRecord.createdAt),
    sqlString(caseRecord.updatedAt),
    sqlJson(caseRecord)
  ])
));

statements.push(buildInsert(
  "app_curation_reviews",
  ["item_id", "tenant_id", "status", "disposition", "note", "corrected_value", "reviewed_at", "reviewed_by"],
  curation.map((review) => [
    sqlString(review.itemId),
    sqlString(review.tenantId),
    sqlString(review.status),
    sqlString(review.disposition || null),
    sqlString(review.note || null),
    sqlString(review.correctedValue || null),
    sqlString(review.reviewedAt || null),
    sqlJson(review.reviewedBy || null)
  ])
));

const outputDir = path.resolve(process.cwd(), "runs", "supabase");
ensureOutputDir(outputDir);
const outputPath = path.join(outputDir, "latest-seed.sql");
fs.writeFileSync(outputPath, statements.join("\n"), "utf8");
process.stdout.write(`Supabase seed export written: ${outputPath}\n`);
