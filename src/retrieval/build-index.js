import fs from "node:fs";
import path from "node:path";
import { readLatestManifest } from "../aggregator/manifest.js";
import { chunkText } from "./chunker.js";
import { tokenize } from "./tokenize.js";
import {
  applyInverseDocumentFrequency,
  buildSemanticFeatureMapFromText,
  computeDocumentFrequency,
  normalizeFeatureMap,
  serializeFeatureMap
} from "./semantic-profile.js";
import {
  cleanRetrievedText,
  isLowSignalChunk,
  sanitizeChunkText,
  trimToRelevantStart
} from "./clean-text.js";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function buildChunkRecord(source, chunk, index) {
  const tokens = tokenize(chunk.text);
  const tokenFrequency = {};

  for (const token of tokens) {
    tokenFrequency[token] = (tokenFrequency[token] || 0) + 1;
  }

  return {
    chunkId: `${source.sourceId}:${index}`,
    sourceId: source.sourceId,
    jurisdictionId: source.jurisdictionId,
    sourceName: source.label,
    sourceUrl: source.url,
    sourceType: source.type,
    scopeType: source.scopeType,
    requiresManualReview: source.requiresManualReview,
    title: source.title || null,
    text: chunk.text,
    startWord: chunk.startWord,
    endWord: chunk.endWord,
    tokenCount: tokens.length,
    tokenFrequency
  };
}

async function main() {
  const aggregationRoot = path.resolve(process.cwd(), "data", "aggregation");
  const outputRoot = path.resolve(process.cwd(), "data", "retrieval");
  const manifest = readLatestManifest(aggregationRoot);

  if (!manifest) {
    throw new Error("No aggregation manifest found. Run `npm run aggregate:sources` first.");
  }

  ensureDir(outputRoot);

  const chunks = [];

  for (const source of manifest.results.filter((entry) => entry.ok && entry.extractedTextPath)) {
    process.stdout.write(`Chunking ${source.sourceId}\n`);
    const text = trimToRelevantStart(
      cleanRetrievedText(readText(source.extractedTextPath)),
      source.sourceId
    );
    const sourceChunks = chunkText(text);

    sourceChunks.forEach((chunk, index) => {
      const sanitizedText = sanitizeChunkText(chunk.text);

      if (isLowSignalChunk(sanitizedText)) {
        return;
      }

      chunks.push(buildChunkRecord(source, { ...chunk, text: sanitizedText }, index));
    });
  }

  const payload = {
    runAt: new Date().toISOString(),
    sourceRunAt: manifest.runAt,
    totalSourcesConsidered: manifest.results.filter((entry) => entry.ok && entry.extractedTextPath).length,
    totalChunks: chunks.length,
    chunks
  };

  const semanticFeatureMaps = chunks.map((chunk) => buildSemanticFeatureMapFromText(chunk.text));
  const documentFrequency = computeDocumentFrequency(semanticFeatureMaps);
  const semanticProfiles = chunks.map((chunk, index) => ({
    chunkId: chunk.chunkId,
    sourceId: chunk.sourceId,
    jurisdictionId: chunk.jurisdictionId,
    sourceType: chunk.sourceType,
    vector: serializeFeatureMap(
      normalizeFeatureMap(
        applyInverseDocumentFrequency(
          semanticFeatureMaps[index],
          documentFrequency,
          chunks.length
        )
      )
    )
  }));
  const semanticIndex = {
    runAt: payload.runAt,
    sourceRunAt: payload.sourceRunAt,
    totalChunks: chunks.length,
    vocabularySize: documentFrequency.size,
    idf: serializeFeatureMap(
      new Map(
        [...documentFrequency.entries()].map(([key, df]) => [
          key,
          Math.log(1 + chunks.length / df)
        ])
      )
    ),
    profiles: semanticProfiles
  };

  fs.writeFileSync(path.join(outputRoot, "chunks.json"), JSON.stringify(chunks, null, 2), "utf8");
  fs.writeFileSync(path.join(outputRoot, "latest-manifest.json"), JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(path.join(outputRoot, "semantic-index.json"), JSON.stringify(semanticIndex, null, 2), "utf8");

  process.stdout.write(
    `Retrieval index built: ${payload.totalChunks} chunks | semantic vocabulary: ${semanticIndex.vocabularySize}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
