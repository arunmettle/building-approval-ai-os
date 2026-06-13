import fs from "node:fs";
import path from "node:path";
import { assessProject } from "./engine.js";

const inputPath = process.argv[2];

if (!inputPath) {
  process.stderr.write("Usage: node src/assessment/cli.js <input-json>\n");
  process.exit(1);
}

const absoluteInputPath = path.resolve(process.cwd(), inputPath);
const input = JSON.parse(fs.readFileSync(absoluteInputPath, "utf8"));
const result = assessProject(input);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
