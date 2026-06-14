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

export async function loginOperator(email, accessCode) {
  const operator = await findOperatorByEmail(email);

  if (!operator || operator.accessCode !== accessCode) {
    throw new Error("Invalid operator credentials.");
  }

  const session = await createSession(operator);

  return {
    token: session.token,
    operator: attachPermissions(operator)
  };
}

export async function getSessionContext(token) {
  if (!token) {
    return null;
  }

  const session = await getSession(token);

  if (!session) {
    return null;
  }

  const operator = await findOperatorById(session.operatorId);

  if (!operator) {
    return null;
  }

  return {
    token: session.token,
    tenantId: session.tenantId,
    operator: attachPermissions(operator)
  };
}

export async function logoutOperator(token) {
  await revokeSession(token);
}

export async function listTenantOperators(tenantId) {
  return (await listOperatorsForTenant(tenantId)).map((operator) => ({
    ...operator,
    permissions: permissionsForRole(operator.role)
  }));
}
