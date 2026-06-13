# Property Lookup Layer

## Purpose

Move assessment from jurisdiction-only guidance to parcel-aware guidance.

## Current MVP Approach

The current repository uses a local property-profile registry in:

- `src/property/profiles.json`

and a lookup/enrichment service in:

- `src/property/lookup.js`

The lookup resolves a property profile from:

- `propertyProfileId`
- `propertyLookupKey`
- `address`
- `lotPlan`

## What Gets Enriched

When a property profile is resolved, the assessment input is enriched with:

- `jurisdictionId`
- `address`
- `zone`
- `zoneKnown`
- `overlays`
- `overlaysKnown`
- `currentUse`

## Current Behavior

- overlay-heavy parcels can escalate to an overlay-sensitive pathway
- risk can move to `high` when review-trigger overlays are present
- reports show resolved property context and source provenance

## Current Limitations

- local fixture registry only
- no live council GIS or property API integration yet
- no polygon geometry or coordinate-based overlay intersection yet

## Next Production Upgrade

Replace or augment the local registry with live council/property lookup adapters for:

- Sunshine Coast interactive mapping
- Moreton Bay property lookup
- Brisbane City Plan / open data pathways
