import path from "node:path";
import { buildSourceRegistry } from "./registry.js";
import { snapshotSource } from "./fetch.js";
import { writeAggregationManifest } from "./manifest.js";

const now = new Date();
const outputRoot = path.resolve(process.cwd(), "data", "aggregation");
const snapshotRoot = path.join(outputRoot, "snapshots");

async function main() {
  const registry = buildSourceRegistry();
  const results = [];

  for (const entry of registry) {
    process.stdout.write(`Fetching ${entry.sourceId} (${entry.url})\n`);
    const result = await snapshotSource(entry, snapshotRoot, now);
    results.push({
      ...result,
      label: entry.label,
      type: entry.type,
      jurisdictionLabel: entry.jurisdictionLabel
    });
  }

  const { manifest, manifestPath } = writeAggregationManifest(outputRoot, results, now);

  process.stdout.write(
    `Aggregation complete: ${manifest.succeeded}/${manifest.totalSources} succeeded. Manifest: ${manifestPath}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
