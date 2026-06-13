export const operators = [
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

export function sanitizeOperator(operator) {
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

export function findOperatorByEmail(email) {
  return operators.find((operator) => operator.email.toLowerCase() === String(email || "").toLowerCase()) || null;
}

export function findOperatorById(operatorId) {
  return operators.find((operator) => operator.operatorId === operatorId) || null;
}

export function listOperatorsForTenant(tenantId) {
  return operators
    .filter((operator) => operator.tenantId === tenantId)
    .map(sanitizeOperator);
}
