import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dataRoot = path.resolve(process.cwd(), "data", "app");
const sessionsPath = path.join(dataRoot, "sessions.json");

function ensureStore() {
  fs.mkdirSync(dataRoot, { recursive: true });

  if (!fs.existsSync(sessionsPath)) {
    fs.writeFileSync(sessionsPath, "[]", "utf8");
  }
}

function readAllSessions() {
  ensureStore();
  return JSON.parse(fs.readFileSync(sessionsPath, "utf8"));
}

function writeAllSessions(sessions) {
  ensureStore();
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2), "utf8");
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
  writeAllSessions(sessions);
  return session;
}

export function getSession(token) {
  const sessions = readAllSessions();
  const session = sessions.find((item) => item.token === token) || null;

  if (!session) {
    return null;
  }

  session.lastSeenAt = new Date().toISOString();
  writeAllSessions(sessions);
  return session;
}

export function revokeSession(token) {
  const sessions = readAllSessions();
  const filtered = sessions.filter((item) => item.token !== token);
  writeAllSessions(filtered);
}
