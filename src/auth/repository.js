import crypto from "node:crypto";
import { createJsonStore } from "../platform/json-store.js";
import { isSupabaseEnabled, deleteRows, selectRows, upsertRows } from "../platform/supabase-client.js";

const sessionStore = createJsonStore("data/app/sessions.json", {
  fallback: []
});

async function readAllSessions() {
  if (!isSupabaseEnabled()) {
    return sessionStore.read();
  }

  return selectRows("app_sessions", {
    order: "last_seen_at.desc"
  });
}

export async function createSession(operator) {
  const session = {
    token: crypto.randomBytes(24).toString("hex"),
    operatorId: operator.operatorId,
    tenantId: operator.tenantId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };

  if (!isSupabaseEnabled()) {
    const sessions = await readAllSessions();
    sessions.push(session);
    sessionStore.write(sessions);
    return session;
  }

  await upsertRows("app_sessions", [{
    token: session.token,
    operator_id: session.operatorId,
    tenant_id: session.tenantId,
    created_at: session.createdAt,
    last_seen_at: session.lastSeenAt
  }], {
    onConflict: "token"
  });

  return session;
}

export async function getSession(token) {
  if (!isSupabaseEnabled()) {
    const sessions = await readAllSessions();
    const session = sessions.find((item) => item.token === token) || null;

    if (!session) {
      return null;
    }

    session.lastSeenAt = new Date().toISOString();
    sessionStore.write(sessions);
    return session;
  }

  const rows = await selectRows("app_sessions", {
    filters: {
      token: `eq.${token}`
    },
    limit: 1
  });

  const row = rows[0];

  if (!row) {
    return null;
  }

  const session = {
    token: row.token,
    operatorId: row.operator_id,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
    lastSeenAt: new Date().toISOString()
  };

  await upsertRows("app_sessions", [{
    token: session.token,
    operator_id: session.operatorId,
    tenant_id: session.tenantId,
    created_at: session.createdAt,
    last_seen_at: session.lastSeenAt
  }], {
    onConflict: "token"
  });

  return session;
}

export async function revokeSession(token) {
  if (!isSupabaseEnabled()) {
    const sessions = await readAllSessions();
    const filtered = sessions.filter((item) => item.token !== token);
    sessionStore.write(filtered);
    return;
  }

  await deleteRows("app_sessions", {
    filters: {
      token: `eq.${token}`
    }
  });
}
