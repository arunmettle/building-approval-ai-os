# Extraction Pipeline

## Purpose

The aggregator is only useful if fetched snapshots become structured evidence.

This extraction layer converts raw snapshot text into:

- evidence records
- threshold rule candidates
- checklist candidates
- extraction manifests

## Version 1 Strategy

The first version is deterministic and source-aware.

- use the latest snapshot manifest as input
- apply source-specific extractors for reviewed high-value pages
- emit machine-readable evidence objects
- emit machine-readable threshold and checklist candidates
- track unsupported sources instead of pretending they were parsed

## Why Source-Aware First

Council pages are inconsistent. A generic parser at this stage would look sophisticated but produce weak lineage and unreliable claims.

The correct first move is:

1. deterministic extraction for high-value official pages
2. explicit unsupported coverage for the rest
3. gradual generalization by source type after enough examples exist

## Current Extractor Coverage

- Brisbane deck guidance
- Brisbane shed guidance
- Sunshine Coast what-needs-building-approval
- Sunshine Coast sheds

## Next Coverage Targets

- Moreton Bay domestic outbuildings
- Queensland state baseline forms and accepted-development guidance
- checklist extraction from lodgement and certifier pages
