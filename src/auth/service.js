import { createSession, getSession, revokeSession } from "./repository.js";
import { findOperatorByEmail, findOperatorById, listOperatorsForTenant, sanitizeOperator } from "./operators.js";
import { permissionsForRole } from "./policy.js";

function attachPermissions(operator) {
  if (!operator) {
    return null;
  }

  return {
    ...sanitizeOperator(operator),
    permissions: permissionsForRole(operator.role)
  };
}

export function loginOperator(email, accessCode) {
  const operator = findOperatorByEmail(email);

  if (!operator || operator.accessCode !== accessCode) {
    throw new Error("Invalid operator credentials.");
  }

  const session = createSession(operator);

  return {
    token: session.token,
    operator: attachPermissions(operator)
  };
}

export function getSessionContext(token) {
  if (!token) {
    return null;
  }

  const session = getSession(token);

  if (!session) {
    return null;
  }

  const operator = findOperatorById(session.operatorId);

  if (!operator) {
    return null;
  }

  return {
    token: session.token,
    tenantId: session.tenantId,
    operator: attachPermissions(operator)
  };
}

export function logoutOperator(token) {
  revokeSession(token);
}

export function listTenantOperators(tenantId) {
  return listOperatorsForTenant(tenantId).map((operator) => ({
    ...operator,
    permissions: permissionsForRole(operator.role)
  }));
}
