import fs from "node:fs";
import path from "node:path";

export function writeAggregationManifest(outputRoot, results, now) {
  fs.mkdirSync(outputRoot, { recursive: true });

  const manifest = {
    runAt: now.toISOString(),
    totalSources: results.length,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results
  };

  const manifestPath = path.join(outputRoot, "latest-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return { manifest, manifestPath };
}

export function readLatestManifest(outputRoot) {
  const manifestPath = path.join(outputRoot, "latest-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
