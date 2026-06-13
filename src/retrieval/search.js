import fs from "node:fs";
import path from "node:path";
import { tokenize } from "./tokenize.js";
import { semanticRetrieve } from "./semantic.js";

const sourceTypeWeights = {
  "council-guidance": 6,
  "planning-scheme-info-sheet": 6,
  "state-guidance": 5,
  "state-forms-guidance": 4,
  "state-process-guidance": 4,
  "planning-scheme-portal": 1,
  "planning-mapping-portal": 0,
  "planning-scheme-portal": 1,
  "historical-approvals-portal": -1,
  "historical-records-search": -1,
  "property-lookup": 0,
  "open-data-dataset": -2,
  "open-data-portal": -2
};

const projectTypeTerms = {
  shed: ["shed", "outbuilding", "class 10a", "garage", "carport"],
  deck: ["deck", "decking"],
  pergola: ["pergola", "gazebo"],
  patio: ["patio", "verandah", "veranda", "awning"],
  pool: ["pool", "swimming pool", "spa"],
  retaining_wall: ["retaining wall"],
  extension: ["extension", "addition"],
  internal_renovation: ["internal renovation", "alteration", "fit-out"],
  garage_carport: ["garage", "carport"],
  granny_flat: ["granny flat", "secondary dwelling", "accessory dwelling"]
};

function normalizeProjectType(projectType) {
  return String(projectType || "")
    .trim()
    .toLowerCase()
    .replace(/[\s/-]+/g, "_");
}

function getProjectTerms(projectType) {
  const normalized = normalizeProjectType(projectType);
  return projectTypeTerms[normalized] || [String(projectType || "").toLowerCase()].filter(Boolean);
}

function countTermMatches(text, terms) {
  let matches = 0;

  for (const term of terms) {
    if (term && text.includes(term)) {
      matches += 1;
    }
  }

  return matches;
}

function projectTypeScore(chunk, input) {
  const projectType = input.projectType;

  if (!projectType) {
    return 0;
  }

  const lowerText = chunk.text.toLowerCase();
  const activeTerms = getProjectTerms(projectType);
  const activeMatches = countTermMatches(lowerText, activeTerms);
  let score = activeMatches * 4;

  for (const [candidateType, candidateTerms] of Object.entries(projectTypeTerms)) {
    if (candidateType === normalizeProjectType(projectType)) {
      continue;
    }

    const conflictingMatches = countTermMatches(lowerText, candidateTerms);

    if (conflictingMatches > 0 && activeMatches === 0) {
      score -= conflictingMatches * 5;
    } else if (conflictingMatches > 0) {
      score -= conflictingMatches * 2;
    }
  }

  return score;
}

function sourceQualityWeight(chunk) {
  let score = sourceTypeWeights[chunk.sourceType] || 0;

  if (chunk.requiresManualReview) {
    score += 1;
  }

  if (chunk.scopeType === "state") {
    score += 1;
  }

  return score;
}

function readChunks() {
  const chunksPath = path.resolve(process.cwd(), "data", "retrieval", "chunks.json");

  if (!fs.existsSync(chunksPath)) {
    throw new Error("No retrieval chunks found. Run `npm run retrieval:build` first.");
  }

  return JSON.parse(fs.readFileSync(chunksPath, "utf8"));
}

function buildQuery(input, assessment) {
  const parts = [
    input.projectType,
    "building approval",
    "planning",
    "setback",
    "overlay",
    ...assessment.unknowns
  ];

  if (input.zone) {
    parts.push(input.zone);
  }

  if (input.boundarySetbacksCompliant === false) {
    parts.push("boundary setback");
  }

  if (input.overlaysKnown === false) {
    parts.push("site report");
  }

  return parts.filter(Boolean).join(" ");
}

function scoreChunk(chunk, queryTokens, input) {
  let score = 0;
  const lowerText = chunk.text.toLowerCase();

  for (const token of queryTokens) {
    score += chunk.tokenFrequency[token] || 0;
  }

  if (input.jurisdictionId && chunk.jurisdictionId === input.jurisdictionId) {
    score += 8;
  } else if (input.jurisdictionId && chunk.jurisdictionId !== input.jurisdictionId) {
    score -= 3;
  }

  if (input.projectType && lowerText.includes(input.projectType.toLowerCase())) {
    score += 2;
  }

  score += projectTypeScore(chunk, input);
  score += sourceQualityWeight(chunk);

  for (const keyword of ["approval", "permit", "setback", "overlay", "site report", "planning"]) {
    if (lowerText.includes(keyword)) {
      score += 2;
    }
  }

  for (const marker of [
    "facebook",
    "instagram",
    "linkedin",
    "copyright",
    "newsletter",
    "events",
    "helpful links",
    "share",
    "id=\"",
    "\\r\\n",
    "&quot;"
  ]) {
    if (lowerText.includes(marker)) {
      score -= 4;
    }
  }

  return score;
}

function diversifyResults(chunks, limit) {
  const selected = [];
  const perSourceCount = new Map();

  for (const chunk of chunks) {
    const current = perSourceCount.get(chunk.sourceId) || 0;

    if (current >= 2) {
      continue;
    }

    selected.push(chunk);
    perSourceCount.set(chunk.sourceId, current + 1);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

export function retrieveRelevantChunks(input, assessment, limit = 5) {
  const chunks = readChunks();
  const query = buildQuery(input, assessment);
  const queryTokens = tokenize(query);
  const semanticResults = semanticRetrieve(input, assessment, limit * 3);
  const semanticScoreByChunkId = new Map(
    semanticResults.map((chunk) => [chunk.chunkId, chunk.semanticScore])
  );

  const ranked = chunks
    .map((chunk) => {
      const lexicalScore = scoreChunk(chunk, queryTokens, input);
      const semanticScore = semanticScoreByChunkId.get(chunk.chunkId) || 0;
      const score = lexicalScore + semanticScore * 10;
      return { ...chunk, lexicalScore, semanticScore, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter(
      (chunk) =>
        !(
          input.jurisdictionId &&
          chunk.jurisdictionId !== input.jurisdictionId &&
          chunk.sourceType?.includes("open-data")
        )
    );

  return diversifyResults(ranked, limit)
    .map((chunk) => ({
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceName: chunk.sourceName,
      sourceUrl: chunk.sourceUrl,
      sourceType: chunk.sourceType,
      jurisdictionId: chunk.jurisdictionId,
      score: chunk.score,
      lexicalScore: chunk.lexicalScore,
      semanticScore: chunk.semanticScore,
      text: chunk.text
    }));
}
