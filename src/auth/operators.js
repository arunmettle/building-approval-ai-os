import { isSupabaseEnabled, selectRows } from "../platform/supabase-client.js";

const seededOperators = [
  {
    operatorId: "op-sunrise-intake",
    tenantId: "tenant-sunrise-installers",
    tenantName: "Sunrise Installers Pilot",
    email: "intake@sunrise-installers.demo",
    displayName: "Ava Intake",
    role: "intake-manager",
    accessCode: "sunrise-intake"
  },
  {
    operatorId: "op-sunrise-review",
    tenantId: "tenant-sunrise-installers",
    tenantName: "Sunrise Installers Pilot",
    email: "review@sunrise-installers.demo",
    displayName: "Milo Review",
    role: "reviewer",
    accessCode: "sunrise-review"
  },
  {
    operatorId: "op-certifier-lead",
    tenantId: "tenant-qld-certifier-desk",
    tenantName: "Queensland Certifier Desk",
    email: "ops@qld-certifier.demo",
    displayName: "Noah Certifier",
    role: "certifier-lead",
    accessCode: "certifier-ops"
  },
  {
    operatorId: "op-certifier-review",
    tenantId: "tenant-qld-certifier-desk",
    tenantName: "Queensland Certifier Desk",
    email: "review@qld-certifier.demo",
    displayName: "Chloe Survey",
    role: "reviewer",
    accessCode: "certifier-review"
  }
];

function sanitizeOperator(operator) {
  if (!operator) {
    return null;
  }

  return {
    operatorId: operator.operatorId,
    tenantId: operator.tenantId,
    tenantName: operator.tenantName,
    email: operator.email,
    displayName: operator.displayName,
    role: operator.role
  };
}

function mapSupabaseOperator(row, tenantNames) {
  return {
    operatorId: row.operator_id,
    tenantId: row.tenant_id,
    tenantName: tenantNames.get(row.tenant_id) || row.tenant_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    accessCode: row.access_code
  };
}

async function loadOperators() {
  if (!isSupabaseEnabled()) {
    return seededOperators;
  }

  const [tenantRows, operatorRows] = await Promise.all([
    selectRows("app_tenants"),
    selectRows("app_operators")
  ]);

  const tenantNames = new Map(tenantRows.map((row) => [row.tenant_id, row.tenant_name]));
  return operatorRows.map((row) => mapSupabaseOperator(row, tenantNames));
}

export async function findOperatorByEmail(email) {
  return (await loadOperators()).find((operator) => operator.email.toLowerCase() === String(email || "").toLowerCase()) || null;
}

export async function findOperatorById(operatorId) {
  return (await loadOperators()).find((operator) => operator.operatorId === operatorId) || null;
}

export async function listOperatorsForTenant(tenantId) {
  return (await loadOperators())
    .filter((operator) => operator.tenantId === tenantId)
    .map(sanitizeOperator);
}

export { sanitizeOperator, seededOperators as operators };
