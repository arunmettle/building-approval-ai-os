import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createCaseFromInput, getCaseDetail, listCaseSummaries, reassessCase, updateReviewerState } from "../cases/service.js";

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

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, { ok: true, service: "building-approval-ai-os", time: new Date().toISOString() });
      return;
    }

    if (request.method === "GET" && pathname === "/api/cases") {
      sendJson(response, 200, { cases: listCaseSummaries() });
      return;
    }

    if (request.method === "POST" && pathname === "/api/cases") {
      const body = await readBody(request);
      const caseRecord = createCaseFromInput(body.input || body);
      sendJson(response, 201, { case: caseRecord });
      return;
    }

    if (request.method === "GET" && /^\/api\/cases\/[^/]+$/.test(pathname)) {
      const caseRecord = getCaseDetail(caseIdFromPathname(pathname));

      if (!caseRecord) {
        sendJson(response, 404, { error: "Case not found." });
        return;
      }

      sendJson(response, 200, { case: caseRecord });
      return;
    }

    if (request.method === "POST" && /^\/api\/cases\/[^/]+\/reassess$/.test(pathname)) {
      const caseRecord = reassessCase(caseIdFromPathname(pathname, "/reassess"));
      sendJson(response, 200, { case: caseRecord });
      return;
    }

    if (request.method === "PATCH" && /^\/api\/cases\/[^/]+\/reviewer$/.test(pathname)) {
      const body = await readBody(request);
      const caseRecord = updateReviewerState(caseIdFromPathname(pathname, "/reviewer"), body);
      sendJson(response, 200, { case: caseRecord });
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
