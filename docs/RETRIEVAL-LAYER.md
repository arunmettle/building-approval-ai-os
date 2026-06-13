# Retrieval Layer

## Purpose

The project now needs query-time evidence lookup, not only hardcoded extractors.

This retrieval layer:

- chunks fetched source text
- builds a local retrieval index
- scores chunks against project context
- returns relevant passages for reports and future LLM synthesis

## Why It Helps

- improves evidence coverage beyond hand-wired extractors
- supports new jurisdictions before full rule extraction is complete
- gives reports a broader evidence context
- provides the missing bridge to later embedding and vector retrieval

## Current Version

The current version is a local hybrid retrieval layer.

- chunking is deterministic
- lexical scoring still drives exact-term precision
- a prebuilt semantic index adds weighted concept matching
- source-aware ranking prefers guidance and rule-bearing pages over portals and datasets
- jurisdiction and project-type weighting still constrain results toward the relevant authority and structure type

## Semantic Index

`npm run retrieval:build` now produces:

- `data/retrieval/chunks.json`
- `data/retrieval/latest-manifest.json`
- `data/retrieval/semantic-index.json`

The semantic index stores:

- weighted sparse vectors per chunk
- inverse-document-frequency weights across the corpus
- vocabulary size for the current retrieval build

This is still local and deterministic. It does not require an external vector database or model provider.

## Next Version

Later this can still be upgraded with:

- provider-based embeddings
- dedicated vector search
- stronger reranking
- LLM context assembly
