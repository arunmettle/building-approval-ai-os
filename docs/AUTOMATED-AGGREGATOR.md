# Automated Aggregator

## Purpose

The product should not depend on manual collation as its operating mode.

This repository now treats manual research notes as bootstrap inputs only. The system direction is:

- structured source registry
- automated fetch and snapshot loop
- normalized content records
- evidence extraction and rule extraction on top

## Version 1 Scope

The first aggregator version does the following:

1. loads the Queensland state baseline and pilot council source catalogs
2. flattens them into a single source registry
3. fetches each source over HTTP
4. stores raw snapshots and normalized text extracts
5. emits a manifest with status, content type, retrieval time, and storage paths

## Why This Comes Before Full Extraction

Without a repeatable snapshot and manifest layer:

- freshness cannot be tracked reliably
- extraction cannot be reproduced
- evidence lineage is weak
- rule extraction becomes brittle

## Next Layer

After this fetch layer, the next build steps are:

- source-type-specific parsers
- clause and section extraction
- threshold and checklist extraction
- stale source detection
- diffing between source versions
