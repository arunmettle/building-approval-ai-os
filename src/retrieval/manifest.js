import fs from "node:fs";
import path from "node:path";

export function readLatestRetrievalManifest(outputRoot) {
  const manifestPath = path.join(outputRoot, "latest-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
