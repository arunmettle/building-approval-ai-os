import fs from "node:fs";
import path from "node:path";
import { readLatestManifest } from "../aggregator/manifest.js";
import { readLatestExtractionManifest } from "../extraction/manifest.js";
import { readLatestRetrievalManifest } from "../retrieval/manifest.js";

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function toSection(track) {
  return [
    `## ${track.id}`,
    "",
    `Category: ${track.category}`,
    `Priority: ${track.priority}`,
    "",
    `Question: ${track.question}`,
    "",
    "Evidence needed:",
    formatList(track.evidenceNeeded),
    "",
    "Next actions:",
    formatList(track.nextActions)
  ].join("\n");
}

export function buildResearchReport({ strategicContext, researchTracks, now }) {
  const manifest = readLatestManifest(path.resolve(process.cwd(), "data", "aggregation"));
  const extractionManifest = readLatestExtractionManifest(
    path.resolve(process.cwd(), "data", "extraction")
  );
  const retrievalManifest = readLatestRetrievalManifest(
    path.resolve(process.cwd(), "data", "retrieval")
  );
  const assumptions = [
    "A narrow wedge beats a generic global launch.",
    "Installer pre-check workflows provide faster ROI than homeowner self-serve.",
    "Deterministic checks should produce most of the value before LLM synthesis."
  ];

  const nextFocus = researchTracks
    .filter((track) => track.priority === "high")
    .map((track) => `${track.id}: ${track.question}`);

  return [
    `# Autoresearch Loop Run - ${now.toISOString()}`,
    "",
    `Product: ${strategicContext.product}`,
    `Geography: ${strategicContext.wedge.geography}`,
    `Users: ${strategicContext.wedge.users.join(", ")}`,
    `Permit types: ${strategicContext.wedge.permitTypes.join(", ")}`,
    `Pilot councils: ${strategicContext.wedge.pilotCouncils.join(", ")}`,
    "",
    "## Aggregation Status",
    manifest
      ? `Latest run: ${manifest.runAt} | Sources: ${manifest.totalSources} | Success: ${manifest.succeeded} | Failed: ${manifest.failed}`
      : "No aggregation manifest found. Run `npm run aggregate:sources`.",
    "",
    "## Extraction Status",
    extractionManifest
      ? `Latest run: ${extractionManifest.runAt} | Supported sources: ${extractionManifest.supportedSources}/${extractionManifest.totalSourcesConsidered} | Rules: ${extractionManifest.extractedThresholdRules} | Checklist items: ${extractionManifest.extractedChecklistItems}`
      : "No extraction manifest found. Run `npm run extract:sources`.",
    "",
    "## Retrieval Status",
    retrievalManifest
      ? `Latest run: ${retrievalManifest.runAt} | Sources: ${retrievalManifest.totalSourcesConsidered} | Chunks: ${retrievalManifest.totalChunks}`
      : "No retrieval manifest found. Run `npm run retrieval:build`.",
    "",
    "## Operating Principles",
    formatList(strategicContext.principles),
    "",
    "## Active Assumptions",
    formatList(assumptions),
    "",
    "## Research Tracks",
    "",
    researchTracks.map(toSection).join("\n\n"),
    "",
    "## Next Loop Focus",
    formatList(nextFocus),
    ""
  ].join("\n");
}

export function writeRunReport(outputDir, report, now) {
  fs.mkdirSync(outputDir, { recursive: true });
  const safeStamp = now.toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `autoresearch-${safeStamp}.md`);
  fs.writeFileSync(filePath, report, "utf8");
  return filePath;
}
