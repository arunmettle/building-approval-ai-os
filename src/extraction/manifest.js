import fs from "node:fs";
import path from "node:path";

export function writeExtractionManifest(outputRoot, payload) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const manifestPath = path.join(outputRoot, "latest-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2), "utf8");
  return manifestPath;
}

export function readLatestExtractionManifest(outputRoot) {
  const manifestPath = path.join(outputRoot, "latest-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
