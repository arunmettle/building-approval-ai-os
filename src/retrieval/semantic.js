import fs from "node:fs";
import path from "node:path";
import { tokenize } from "./tokenize.js";

function readChunks() {
  const chunksPath = path.resolve(process.cwd(), "data", "retrieval", "chunks.json");

  if (!fs.existsSync(chunksPath)) {
    throw new Error("No retrieval chunks found. Run `npm run retrieval:build` first.");
  }

  return JSON.parse(fs.readFileSync(chunksPath, "utf8"));
}

function expandToken(token) {
  const expansions = {
    pergola: ["patio", "verandah", "gazebo", "shade"],
    patio: ["pergola", "verandah", "deck", "roofed"],
    deck: ["balcony", "patio", "outdoor"],
    shed: ["outbuilding", "garage", "carport", "class", "10a"],
    approval: ["permit", "application", "certifier"],
    overlay: ["hazard", "character", "flood", "heritage", "bushfire"],
    setback: ["boundary", "frontage", "rear", "side", "siting"],
    planning: ["scheme", "zone", "code"],
    report: ["site", "property"],
    certifier: ["building", "private", "approval"]
  };

  return [token, ...(expansions[token] || [])];
}

function vectorize(tokens) {
  const vector = new Map();

  for (const token of tokens) {
    vector.set(token, (vector.get(token) || 0) + 1);
  }

  return vector;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (const value of a.values()) {
    aNorm += value * value;
  }

  for (const value of b.values()) {
    bNorm += value * value;
  }

  for (const [key, value] of a.entries()) {
    if (b.has(key)) {
      dot += value * b.get(key);
    }
  }

  if (aNorm === 0 || bNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

function buildSemanticQueryTokens(input, assessment) {
  const baseTokens = tokenize(
    [
      input.projectType,
      "building approval permit planning scheme",
      "setback boundary overlay code",
      ...assessment.unknowns
    ]
      .filter(Boolean)
      .join(" ")
  );

  return [...new Set(baseTokens.flatMap(expandToken))];
}

export function semanticRetrieve(input, assessment, limit = 10) {
  const chunks = readChunks();
  const queryVector = vectorize(buildSemanticQueryTokens(input, assessment));

  return chunks
    .map((chunk) => {
      const chunkVector = vectorize(tokenize(chunk.text));
      const semanticScore = cosineSimilarity(queryVector, chunkVector);
      return { ...chunk, semanticScore };
    })
    .filter((chunk) => chunk.semanticScore > 0)
    .sort((a, b) => b.semanticScore - a.semanticScore)
    .slice(0, limit);
}
