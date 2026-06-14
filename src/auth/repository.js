import crypto from "node:crypto";
import { createJsonStore } from "../platform/json-store.js";

const sessionStore = createJsonStore("data/app/sessions.json", {
  fallback: []
});

function readAllSessions() {
  return sessionStore.read();
}

export function createSession(operator) {
  const sessions = readAllSessions();
  const session = {
    token: crypto.randomBytes(24).toString("hex"),
    operatorId: operator.operatorId,
    tenantId: operator.tenantId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };

  sessions.push(session);
  sessionStore.write(sessions);
  return session;
}

export function getSession(token) {
  const sessions = readAllSessions();
  const session = sessions.find((item) => item.token === token) || null;

  if (!session) {
    return null;
  }

  session.lastSeenAt = new Date().toISOString();
  sessionStore.write(sessions);
  return session;
}

export function revokeSession(token) {
  const sessions = readAllSessions();
  const filtered = sessions.filter((item) => item.token !== token);
  sessionStore.write(filtered);
}
