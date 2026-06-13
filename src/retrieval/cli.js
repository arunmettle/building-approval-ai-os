import fs from "node:fs";
import path from "node:path";
import { assessProject } from "../assessment/engine.js";
import { retrieveRelevantChunks } from "./search.js";

const inputPath = process.argv[2];

if (!inputPath) {
  process.stderr.write("Usage: node src/retrieval/cli.js <input-json>\n");
  process.exit(1);
}

const absoluteInputPath = path.resolve(process.cwd(), inputPath);
const input = JSON.parse(fs.readFileSync(absoluteInputPath, "utf8"));
const assessment = assessProject(input);
const results = retrieveRelevantChunks(input, assessment);

process.stdout.write(`${JSON.stringify({ input, assessment, results }, null, 2)}\n`);
