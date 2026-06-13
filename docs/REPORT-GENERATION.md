# Report Generation

## Purpose

The MVP needs a concrete deliverable that installers and certifier-support users can consume.

That deliverable is a submission-readiness style report that contains:

- likely approval pathway
- evidence-supported risk rating
- matched evidence-backed rule outcomes
- missing or unknown fields
- likely required documents
- professional review recommendation
- citations
- assumptions and disclaimers

## Output Rules

- never say approved
- never say legally compliant
- never say guaranteed approval
- always show unknowns
- always show evidence lineage for matched claims

## Version 1

The first report generator is deterministic and file-based.

- input: intake JSON
- processing: deterministic assessment
- output: JSON recommendation object and Markdown report

## Why This Is The Right Next Step

This gives the project a usable output surface before adding LLM synthesis.
