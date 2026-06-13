import fs from "node:fs";
import path from "node:path";
import { generateReportFromInput } from "./generate.js";

const inputPath = process.argv[2];

if (!inputPath) {
  process.stderr.write("Usage: node src/reporting/cli.js <input-json>\n");
  process.exit(1);
}

const absoluteInputPath = path.resolve(process.cwd(), inputPath);
const input = JSON.parse(fs.readFileSync(absoluteInputPath, "utf8"));
const outputDir = path.resolve(process.cwd(), "runs", "reports");
const result = generateReportFromInput(input, outputDir);

process.stdout.write(`Report written:\nJSON: ${result.jsonPath}\nMarkdown: ${result.mdPath}\n`);
