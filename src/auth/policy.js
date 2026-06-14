const rolePermissions = {
  "intake-manager": [
    "session:view",
    "operators:view",
    "queue:view",
    "cases:view",
    "cases:create",
    "property:lookup",
    "evaluation:view"
  ],
  reviewer: [
    "session:view",
    "operators:view",
    "queue:view",
    "cases:view",
    "cases:create",
    "cases:review",
    "cases:reassess",
    "property:lookup",
    "curation:view",
    "curation:review",
    "evaluation:view"
  ],
  "certifier-lead": [
    "session:view",
    "operators:view",
    "queue:view",
    "cases:view",
    "cases:create",
    "cases:review",
    "cases:reassess",
    "property:lookup",
    "curation:view",
    "curation:review",
    "evaluation:view",
    "admin:tenant"
  ]
};

export function permissionsForRole(role) {
  return rolePermissions[role] || [];
}

export function operatorHasPermission(operator, permission) {
  return permissionsForRole(operator?.role).includes(permission);
}

export function assertPermission(sessionContext, permission) {
  if (!operatorHasPermission(sessionContext?.operator, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}.`);
  }
}
