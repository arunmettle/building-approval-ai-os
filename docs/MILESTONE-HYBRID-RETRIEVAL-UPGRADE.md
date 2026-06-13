# Milestone Complete: Hybrid Retrieval Upgrade

Date: 2026-06-13

## Milestone Objective

Upgrade retrieval from lexical-plus-ad-hoc semantic scoring to a prebuilt hybrid index that supports stronger semantic matching without losing current lexical, jurisdiction, and project-type controls.

## Completion Criteria

- retrieval build emits a semantic index artifact
- semantic scoring uses precomputed weighted vectors instead of re-vectorizing raw chunks on every query
- lexical and semantic scores are combined in the existing ranking path
- retrieval and report generation still work end to end
- same-jurisdiction guidance remains dominant for the Sunshine Coast shed example

## What Was Added

- shared semantic feature builder in `src/retrieval/semantic-profile.js`
- semantic index generation in `src/retrieval/build-index.js`
- query-time semantic retrieval over `data/retrieval/semantic-index.json` in `src/retrieval/semantic.js`
- retrieval layer documentation update in `docs/RETRIEVAL-LAYER.md`

## Outcome

- retrieval build now outputs `semantic-index.json`
- the current semantic vocabulary is `1945` weighted terms across `204` cleaned chunks
- semantic retrieval is now a real indexed step in the pipeline rather than only an on-the-fly token expansion helper
- reporting remains compatible with the upgraded retrieval layer

## What Is Still Out Of Scope

- provider-generated embeddings
- external vector databases
- learning-to-rank or model-based rerankers
- cross-encoder claim verification

## Remaining Core MVP Milestones

After this milestone, `2` core MVP milestones remain:

- property-specific overlay and zoning lookup
- reviewer workflow states for human-in-the-loop escalation
