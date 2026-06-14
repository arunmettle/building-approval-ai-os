import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { listQueue, createCaseFromInput, getCaseDetail, listCaseSummaries, reassessCase, updateReviewerState } from "../cases/service.js";
import { getSessionContext, listTenantOperators, loginOperator, logoutOperator } from "../auth/service.js";
import { getEvaluationDashboard, listCurationItems, reviewCurationItem } from "../curation/service.js";
import { assertPermission } from "../auth/policy.js";
import { resolvePropertyLookup } from "../property/lookup.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4010);
const publicRoot = path.resolve(process.cwd(), "src", "web");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, payload, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(payload);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }

  return "text/plain; charset=utf-8";
}

function serveStatic(requestPath, response) {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\//, "");
  const absolutePath = path.resolve(publicRoot, relativePath);

  if (!absolutePath.startsWith(publicRoot) || !fs.existsSync(absolutePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  sendText(response, 200, fs.readFileSync(absolutePath, "utf8"), contentTypeFor(absolutePath));
}

function caseIdFromPathname(pathname, suffix = "") {
  const base = pathname.replace(/^\/api\/cases\//, "");
  return suffix ? base.replace(new RegExp(`${suffix}$`), "") : base;
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function authenticateApiRequest(request) {
  const token = getBearerToken(request);
  return getSessionContext(token);
}

function requireSession(request, response) {
  const sessionContext = authenticateApiRequest(request);

  if (!sessionContext) {
    sendJson(response, 401, { error: "Authentication required." });
    return null;
  }

  return sessionContext;
}

function requirePermission(sessionContext, response, permission) {
  try {
    assertPermission(sessionContext, permission);
    return true;
  } catch (error) {
    sendJson(response, 403, { error: error.message });
    return false;
  }
}

function filtersFromQuery(url) {
  return {
    state: url.searchParams.get("state") || null,
    priority: url.searchParams.get("priority") || null,
    projectType: url.searchParams.get("projectType") || null,
    assignment: url.searchParams.get("assignment") || null
  };
}

function curationFiltersFromQuery(url) {
  return {
    status: url.searchParams.get("status") || null,
    type: url.searchParams.get("type") || null
  };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, { ok: true, service: "building-approval-ai-os", time: new Date().toISOString() });
      return;
    }

    if (request.method === "POST" && pathname === "/api/session/login") {
      const body = await readBody(request);
      const session = loginOperator(body.email, body.accessCode);
      sendJson(response, 200, { session });
      return;
    }

    if (request.method === "GET" && pathname === "/api/session") {
      const sessionContext = requireSession(request, response);

      if (!sessionContext) {
        return;
      }

      if (!requirePermission(sessionContext, response, "session:view")) {
        return;
      }

      sendJson(response, 200, { session: sessionContext });
      return;
    }

    if (request.method === "POST" && pathname === "/api/session/logout") {
      const sessionContext = requireSession(request, response);

      if (!sessionContext) {
        return;
      }

      if (!requirePermission(sessionContext, response, "session:view")) {
        return;
      }

      logoutOperator(sessionContext.token);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (pathname.startsWith("/api/")) {
      const sessionContext = requireSession(request, response);

      if (!sessionContext) {
        return;
      }

      if (request.method === "GET" && pathname === "/api/operators") {
        if (!requirePermission(sessionContext, response, "operators:view")) {
          return;
        }
        sendJson(response, 200, { operators: listTenantOperators(sessionContext.tenantId) });
        return;
      }

      if (request.method === "GET" && pathname === "/api/queue") {
        if (!requirePermission(sessionContext, response, "queue:view")) {
          return;
        }
        sendJson(response, 200, listQueue(sessionContext, filtersFromQuery(url)));
        return;
      }

      if (request.method === "GET" && pathname === "/api/evaluation/dashboard") {
        if (!requirePermission(sessionContext, response, "evaluation:view")) {
          return;
        }
        sendJson(response, 200, getEvaluationDashboard(sessionContext));
        return;
      }

      if (request.method === "GET" && pathname === "/api/curation/items") {
        if (!requirePermission(sessionContext, response, "curation:view")) {
          return;
        }
        sendJson(response, 200, listCurationItems(sessionContext, curationFiltersFromQuery(url)));
        return;
      }

      if (request.method === "GET" && pathname === "/api/property/lookup") {
        if (!requirePermission(sessionContext, response, "property:lookup")) {
          return;
        }

        const lookup = resolvePropertyLookup({
          jurisdictionId: url.searchParams.get("jurisdictionId") || null,
          propertyProfileId: url.searchParams.get("propertyProfileId") || null,
          propertyLookupKey: url.searchParams.get("propertyLookupKey") || null,
          address: url.searchParams.get("address") || null,
          lotPlan: url.searchParams.get("lotPlan") || null
        });

        sendJson(response, 200, { lookup });
        return;
      }

      if (request.method === "GET" && pathname === "/api/cases") {
        if (!requirePermission(sessionContext, response, "cases:view")) {
          return;
        }
        sendJson(response, 200, { cases: listCaseSummaries(sessionContext) });
        return;
      }

      if (request.method === "POST" && pathname === "/api/cases") {
        if (!requirePermission(sessionContext, response, "cases:create")) {
          return;
        }
        const body = await readBody(request);
        const caseRecord = createCaseFromInput(body.input || body, sessionContext);
        sendJson(response, 201, { case: caseRecord });
        return;
      }

      if (request.method === "GET" && /^\/api\/cases\/[^/]+$/.test(pathname)) {
        if (!requirePermission(sessionContext, response, "cases:view")) {
          return;
        }
        const caseRecord = getCaseDetail(caseIdFromPathname(pathname), sessionContext);

        if (!caseRecord) {
          sendJson(response, 404, { error: "Case not found." });
          return;
        }

        sendJson(response, 200, { case: caseRecord });
        return;
      }

      if (request.method === "POST" && /^\/api\/cases\/[^/]+\/reassess$/.test(pathname)) {
        if (!requirePermission(sessionContext, response, "cases:reassess")) {
          return;
        }
        const caseRecord = reassessCase(caseIdFromPathname(pathname, "/reassess"), sessionContext);
        sendJson(response, 200, { case: caseRecord });
        return;
      }

      if (request.method === "PATCH" && /^\/api\/cases\/[^/]+\/reviewer$/.test(pathname)) {
        if (!requirePermission(sessionContext, response, "cases:review")) {
          return;
        }
        const body = await readBody(request);
        const caseRecord = updateReviewerState(caseIdFromPathname(pathname, "/reviewer"), body, sessionContext);
        sendJson(response, 200, { case: caseRecord });
        return;
      }

      if (request.method === "PATCH" && /^\/api\/curation\/items\/[^/]+\/review$/.test(pathname)) {
        if (!requirePermission(sessionContext, response, "curation:review")) {
          return;
        }
        const body = await readBody(request);
        const itemId = pathname.replace(/^\/api\/curation\/items\//, "").replace(/\/review$/, "");
        const item = reviewCurationItem(itemId, body, sessionContext);
        sendJson(response, 200, { item });
        return;
      }

      sendJson(response, 404, { error: "Route not found." });
      return;
    }

    if (request.method === "GET" && (pathname === "/" || pathname.startsWith("/app") || pathname.endsWith(".js") || pathname.endsWith(".css"))) {
      serveStatic(pathname === "/app" ? "/index.html" : pathname, response);
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unexpected server error." });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Building Approval AI OS app listening at http://${host}:${port}\n`);
});
