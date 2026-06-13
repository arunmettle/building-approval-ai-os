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

The current version is lexical rather than embedding-based.

- chunking is deterministic
- scoring is term-based with jurisdiction and project-type boosts
- source-aware ranking prefers guidance and rule-bearing pages over portals and datasets
- retrieval is transparent and easy to debug

## Next Version

Later this can be upgraded with:

- semantic embeddings
- vector search
- hybrid lexical plus vector ranking
- LLM context assembly
