# Milestone Complete: Claim-Safe Explanation Layer

Date: 2026-06-13

## Milestone Objective

Produce richer user-facing explanations from retrieved evidence and extracted checklist signals while preventing unsupported explanation text from reaching the final report.

## Completion Criteria

- explanation output is richer than the earlier claim list
- explanation is stored as structured sentence objects and rendered as paragraphs
- document guidance carries checklist-source provenance into citations
- explanation sentences are validated against citation presence and support terms
- only supported explanation sentences appear in the final validated output path

## What Was Added

- structured explanation planner in `src/reporting/explanation.js`
- wider citation coverage across matched rules, checklist items, and retrieved context
- stronger validation logic in `src/reporting/claim-validator.js`
- explanation-aware report rendering in `src/reporting/markdown.js`
- recommendation contract now requires an `explanation` object

## What This Enables

- richer explanation quality without switching to unconstrained LLM prose
- a safer bridge to later provider-based AI drafting
- sentence-level auditability for pathway, standards, planning, document, and review guidance

## What Is Still Out Of Scope

- free-form external LLM calls
- semantic contradiction detection across citations
- legal-grade claim verification

## Next Milestone

`Retrieval Quality Hardening`

That milestone should remove remaining header/menu residue and encoding artefacts from retrieved passages so later AI drafting starts from cleaner regulatory context.
