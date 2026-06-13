import fs from "node:fs";
import path from "node:path";
import { assessProject } from "../assessment/engine.js";
import { buildRecommendation } from "./recommendation.js";
import { buildMarkdownReport } from "./markdown.js";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function generateReportFromInput(input, outputDir) {
  const assessment = assessProject(input);
  const recommendation = buildRecommendation(input, assessment);
  const markdown = buildMarkdownReport(input, assessment, recommendation);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  ensureDir(outputDir);

  const jsonPath = path.join(outputDir, `report-${stamp}.json`);
  const mdPath = path.join(outputDir, `report-${stamp}.md`);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ input, assessment, recommendation }, null, 2),
    "utf8"
  );
  fs.writeFileSync(mdPath, markdown, "utf8");

  return { jsonPath, mdPath, assessment, recommendation };
}
