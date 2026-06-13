import fs from "node:fs";
import path from "node:path";
import { tokenize } from "./tokenize.js";
import {
  applyIdfWeights,
  buildSemanticFeatureMapFromTokens,
  cosineSimilarity,
  deserializeFeatureMap,
  normalizeFeatureMap
} from "./semantic-profile.js";

function readSemanticIndex() {
  const semanticIndexPath = path.resolve(process.cwd(), "data", "retrieval", "semantic-index.json");

  if (!fs.existsSync(semanticIndexPath)) {
    throw new Error("No semantic retrieval index found. Run `npm run retrieval:build` first.");
  }

  return JSON.parse(fs.readFileSync(semanticIndexPath, "utf8"));
}

function buildSemanticQueryTokens(input, assessment) {
  const parts = [
    input.projectType,
    "building approval permit planning scheme",
    "setback boundary overlay code certifier site report",
    ...assessment.unknowns
  ];

  if (input.zone) {
    parts.push(input.zone);
  }

  if (input.overlaysKnown === false) {
    parts.push("overlay site report mapping");
  }

  if (input.boundarySetbacksCompliant === false) {
    parts.push("setback variation boundary siting");
  }

  return tokenize(parts.filter(Boolean).join(" "));
}

function buildQueryVector(input, assessment, semanticIndex) {
  const rawFeatureMap = buildSemanticFeatureMapFromTokens(buildSemanticQueryTokens(input, assessment), 1.2);
  const idfMap = deserializeFeatureMap(semanticIndex.idf);

  return normalizeFeatureMap(applyIdfWeights(rawFeatureMap, idfMap));
}

export function semanticRetrieve(input, assessment, limit = 10) {
  const semanticIndex = readSemanticIndex();
  const queryVector = buildQueryVector(input, assessment, semanticIndex);

  return semanticIndex.profiles
    .map((profile) => {
      const semanticScore = cosineSimilarity(queryVector, deserializeFeatureMap(profile.vector));
      return {
        chunkId: profile.chunkId,
        sourceId: profile.sourceId,
        jurisdictionId: profile.jurisdictionId,
        sourceType: profile.sourceType,
        semanticScore
      };
    })
    .filter((profile) => profile.semanticScore > 0)
    .sort((a, b) => b.semanticScore - a.semanticScore)
    .slice(0, limit);
}
