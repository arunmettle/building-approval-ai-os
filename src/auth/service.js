import { createSession, getSession, revokeSession } from "./repository.js";
import { findOperatorByEmail, findOperatorById, listOperatorsForTenant, sanitizeOperator } from "./operators.js";

export function loginOperator(email, accessCode) {
  const operator = findOperatorByEmail(email);

  if (!operator || operator.accessCode !== accessCode) {
    throw new Error("Invalid operator credentials.");
  }

  const session = createSession(operator);

  return {
    token: session.token,
    operator: sanitizeOperator(operator)
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
    operator: sanitizeOperator(operator)
  };
}

export function logoutOperator(token) {
  revokeSession(token);
}

export function listTenantOperators(tenantId) {
  return listOperatorsForTenant(tenantId);
}
