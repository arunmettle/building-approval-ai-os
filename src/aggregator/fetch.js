import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_HEADERS = {
  "user-agent": "BuildingApprovalAIOS/0.1 (+source snapshot pipeline)"
};

function sanitizeContentType(contentType) {
  return (contentType || "unknown").split(";")[0].trim().toLowerCase();
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
}

function contentExtension(contentType) {
  if (contentType.includes("html")) {
    return "html";
  }

  if (contentType.includes("json")) {
    return "json";
  }

  if (contentType.includes("pdf")) {
    return "pdf";
  }

  if (contentType.includes("xml")) {
    return "xml";
  }

  return "bin";
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content, encoding = "utf8") {
  fs.writeFileSync(filePath, content, encoding);
}

async function fetchOnce(entry) {
  const response = await fetch(entry.url, { headers: DEFAULT_HEADERS, redirect: "follow" });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = sanitizeContentType(response.headers.get("content-type"));

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType,
    buffer
  };
}

export async function snapshotSource(entry, snapshotRoot, now) {
  const sourceDir = path.join(snapshotRoot, entry.jurisdictionId, entry.sourceId);
  ensureDir(sourceDir);

  const retrievalStamp = now.toISOString().replace(/[:.]/g, "-");

  try {
    const response = await fetchOnce(entry);
    const extension = contentExtension(response.contentType);
    const rawPath = path.join(sourceDir, `${retrievalStamp}.raw.${extension}`);
    const metadataPath = path.join(sourceDir, `${retrievalStamp}.json`);
    const extractedTextPath = path.join(sourceDir, `${retrievalStamp}.txt`);
    const hash = crypto.createHash("sha256").update(response.buffer).digest("hex");

    fs.writeFileSync(rawPath, response.buffer);

    let extractedText = null;
    let title = null;

    if (response.contentType.includes("html")) {
      const html = response.buffer.toString("utf8");
      title = extractTitle(html);
      extractedText = stripHtml(html);
      writeFile(extractedTextPath, extractedText);
    } else if (response.contentType.includes("json") || response.contentType.includes("xml")) {
      extractedText = response.buffer.toString("utf8");
      writeFile(extractedTextPath, extractedText);
    }

    const metadata = {
      sourceId: entry.sourceId,
      jurisdictionId: entry.jurisdictionId,
      url: entry.url,
      finalUrl: response.finalUrl,
      retrievedAt: now.toISOString(),
      contentType: response.contentType,
      status: response.status,
      ok: response.ok,
      hash,
      title,
      rawPath,
      extractedTextPath: extractedText ? extractedTextPath : null
    };

    writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  } catch (error) {
    const metadataPath = path.join(sourceDir, `${retrievalStamp}.json`);
    const failure = {
      sourceId: entry.sourceId,
      jurisdictionId: entry.jurisdictionId,
      url: entry.url,
      retrievedAt: now.toISOString(),
      ok: false,
      error: error.message
    };

    writeFile(metadataPath, JSON.stringify(failure, null, 2));
    return failure;
  }
}
