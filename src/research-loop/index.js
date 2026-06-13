import path from "node:path";
import { buildResearchReport, writeRunReport } from "./engine.js";
import { researchTracks, strategicContext } from "./tasks.js";

const isDryRun = process.argv.includes("--dry-run");
const now = new Date();

const report = buildResearchReport({
  strategicContext,
  researchTracks,
  now
});

if (isDryRun) {
  process.stdout.write(report);
  process.exit(0);
}

const outputDir = path.resolve(process.cwd(), "runs");
const filePath = writeRunReport(outputDir, report, now);

process.stdout.write(`Research loop report written to ${filePath}\n`);
