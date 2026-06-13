# Milestone Complete: Retrieval Quality Hardening

Date: 2026-06-13

## Milestone Objective

Reduce retrieval noise so report and explanation generation start from cleaner regulatory passages rather than scraped navigation, menu text, and encoding debris.

## Completion Criteria

- retrieval cleaning is source-aware before chunking
- chunk text is sanitized again after chunking
- low-signal filtering removes short navigation fragments
- retrieved passages for the Sunshine Coast shed example are primarily substantive regulatory text
- rebuilt report output carries cleaner retrieved context without breaking assessment or explanation generation

## What Was Added

- expanded text normalization and mojibake cleanup in `src/retrieval/clean-text.js`
- source-specific start markers for Queensland, Brisbane, Moreton Bay, and Sunshine Coast sources
- post-chunk sanitization to strip breadcrumbs, menu labels, duplicate titles, and repeated note blocks
- stronger low-signal filtering using both boilerplate markers and token-count thresholds

## Outcome

- retrieval index reduced from `212` chunks to `204` cleaner chunks
- Sunshine Coast shed retrieval now starts with substantive shed siting and certifier guidance instead of page headers
- report generation remains compatible with the hardened retrieval layer

## What Is Still Out Of Scope

- fully clean extraction snippets from non-retrieval citation sources
- embeddings or vector-provider upgrades
- semantic contradiction detection across retrieved passages

## Next Milestone

`Hybrid Retrieval Upgrade`

That milestone should add real embeddings-based retrieval or a stronger semantic index on top of the cleaned chunk corpus, while preserving the current lexical and jurisdiction-aware ranking behavior.
