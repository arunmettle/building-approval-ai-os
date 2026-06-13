import path from "node:path";
import { readLatestManifest } from "../aggregator/manifest.js";
import { ensureDir, readText, writeJson } from "./io.js";
import { extractFromSource } from "./source-extractors.js";
import { writeExtractionManifest } from "./manifest.js";

const now = new Date();
const aggregationRoot = path.resolve(process.cwd(), "data", "aggregation");
const extractionRoot = path.resolve(process.cwd(), "data", "extraction");

function buildSourceResult(source, extraction, metadataPath) {
  const nestedEvidenceCount =
    extraction.thresholdRules.filter((rule) => rule.evidence).length +
    extraction.checklistItems.filter((item) => item.evidence).length;

  return {
    sourceId: source.sourceId,
    jurisdictionId: source.jurisdictionId,
    supported: extraction.supported,
    evidenceCount: extraction.evidenceRecords.length + nestedEvidenceCount,
    thresholdRuleCount: extraction.thresholdRules.length,
    checklistItemCount: extraction.checklistItems.length,
    notes: extraction.notes,
    metadataPath
  };
}

async function main() {
  const manifest = readLatestManifest(aggregationRoot);

  if (!manifest) {
    throw new Error("No aggregation manifest found. Run the source aggregator first.");
  }

  ensureDir(extractionRoot);

  const evidenceRecords = [];
  const thresholdRules = [];
  const checklistItems = [];
  const sourceResults = [];

  for (const source of manifest.results.filter((entry) => entry.ok && entry.extractedTextPath)) {
    process.stdout.write(`Extracting ${source.sourceId}\n`);
    const text = readText(source.extractedTextPath);
    const extraction = extractFromSource(source, text, now, source.rawPath);

    const nestedEvidence = [
      ...extraction.thresholdRules.map((rule) => rule.evidence),
      ...extraction.checklistItems.map((item) => item.evidence)
    ].filter(Boolean);

    evidenceRecords.push(...extraction.evidenceRecords, ...nestedEvidence);
    thresholdRules.push(...extraction.thresholdRules);
    checklistItems.push(...extraction.checklistItems);

    sourceResults.push(
      buildSourceResult(
        source,
        extraction,
        source.rawPath
      )
    );
  }

  writeJson(path.join(extractionRoot, "evidence-records.json"), evidenceRecords);
  writeJson(path.join(extractionRoot, "threshold-rules.json"), thresholdRules);
  writeJson(path.join(extractionRoot, "checklist-items.json"), checklistItems);

  const manifestPayload = {
    runAt: now.toISOString(),
    aggregationRunAt: manifest.runAt,
    totalSourcesConsidered: manifest.results.filter((entry) => entry.ok && entry.extractedTextPath).length,
    supportedSources: sourceResults.filter((result) => result.supported).length,
    extractedEvidenceRecords: evidenceRecords.length,
    extractedThresholdRules: thresholdRules.length,
    extractedChecklistItems: checklistItems.length,
    sourceResults
  };

  const manifestPath = writeExtractionManifest(extractionRoot, manifestPayload);

  process.stdout.write(
    `Extraction complete: ${manifestPayload.extractedThresholdRules} rules, ${manifestPayload.extractedChecklistItems} checklist items. Manifest: ${manifestPath}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
