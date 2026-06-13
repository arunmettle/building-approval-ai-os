import { tokenize } from "./tokenize.js";

const expansionMap = {
  pergola: ["patio", "verandah", "gazebo", "shade", "awning"],
  patio: ["pergola", "verandah", "deck", "roofed", "awning"],
  deck: ["balcony", "patio", "outdoor", "decking"],
  shed: ["outbuilding", "garage", "carport", "class", "10a", "domestic"],
  outbuilding: ["shed", "garage", "carport", "class", "10a"],
  garage: ["shed", "carport", "outbuilding", "class", "10a"],
  carport: ["shed", "garage", "outbuilding", "class", "10a"],
  approval: ["permit", "application", "certifier", "accepted", "assessment"],
  permit: ["approval", "application", "certifier"],
  certifier: ["building", "private", "approval", "assessment"],
  overlay: ["hazard", "character", "flood", "heritage", "bushfire", "mapping"],
  setback: ["boundary", "frontage", "rear", "side", "siting"],
  planning: ["scheme", "zone", "code", "assessment"],
  report: ["site", "property", "mapping"],
  code: ["planning", "development", "building"],
  building: ["approval", "certifier", "development"],
  application: ["approval", "permit", "assessment"]
};

function addWeight(map, key, weight) {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) || 0) + weight);
}

export function buildSemanticFeatureMapFromTokens(tokens, baseWeight = 1) {
  const featureMap = new Map();

  for (const token of tokens) {
    addWeight(featureMap, token, baseWeight);

    for (const expanded of expansionMap[token] || []) {
      addWeight(featureMap, expanded, baseWeight * 0.45);
    }
  }

  return featureMap;
}

export function buildSemanticFeatureMapFromText(text) {
  return buildSemanticFeatureMapFromTokens(tokenize(text));
}

export function mergeFeatureMaps(maps) {
  const merged = new Map();

  for (const map of maps) {
    for (const [key, value] of map.entries()) {
      addWeight(merged, key, value);
    }
  }

  return merged;
}

export function computeDocumentFrequency(featureMaps) {
  const documentFrequency = new Map();

  for (const featureMap of featureMaps) {
    for (const key of featureMap.keys()) {
      documentFrequency.set(key, (documentFrequency.get(key) || 0) + 1);
    }
  }

  return documentFrequency;
}

export function applyInverseDocumentFrequency(featureMap, documentFrequency, totalDocuments) {
  const weighted = new Map();

  for (const [key, value] of featureMap.entries()) {
    const df = documentFrequency.get(key) || 1;
    const idf = Math.log(1 + totalDocuments / df);
    weighted.set(key, value * idf);
  }

  return weighted;
}

export function applyIdfWeights(featureMap, idfMap) {
  const weighted = new Map();

  for (const [key, value] of featureMap.entries()) {
    weighted.set(key, value * (idfMap.get(key) || 1));
  }

  return weighted;
}

export function normalizeFeatureMap(featureMap) {
  let norm = 0;

  for (const value of featureMap.values()) {
    norm += value * value;
  }

  if (norm === 0) {
    return new Map();
  }

  const divisor = Math.sqrt(norm);
  const normalized = new Map();

  for (const [key, value] of featureMap.entries()) {
    normalized.set(key, value / divisor);
  }

  return normalized;
}

export function serializeFeatureMap(featureMap) {
  return Object.fromEntries(featureMap.entries());
}

export function deserializeFeatureMap(featureMapObject) {
  return new Map(Object.entries(featureMapObject || {}).map(([key, value]) => [key, Number(value)]));
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];

  for (const [key, value] of smaller.entries()) {
    const other = larger.get(key);

    if (other) {
      dot += value * other;
    }
  }

  return dot;
}
