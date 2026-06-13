# Milestone Complete: Property-Specific Overlay And Zoning Lookup

Date: 2026-06-13

## Milestone Objective

Add parcel-level property context so assessments can resolve zone and overlay information from a property profile instead of relying only on manually supplied intake flags.

## Completion Criteria

- assessment resolves a property profile before rule evaluation
- enriched input carries zone and overlay context into the assessment
- overlay-trigger parcels can escalate pathway and review status
- reports show resolved property context and lookup provenance
- example assessment demonstrates parcel-driven escalation

## What Was Added

- property profile contract in `src/app/contracts/property-profile.js`
- local property registry in `data/property/profiles.json`
- property lookup and enrichment service in `src/property/lookup.js`
- parcel-aware assessment changes in `src/assessment/engine.js`
- report output changes in `src/reporting/recommendation.js`, `src/reporting/generate.js`, and `src/reporting/markdown.js`
- intake updates in `src/app/contracts/intake-schema.js`

## Outcome

- the Sunshine Coast shed example now resolves a parcel profile automatically
- the example parcel contributes:
  - `Low density residential zone`
  - `flood hazard`
  - `coastal`
- that parcel context changes the result to:
  - overlay-sensitive pathway
  - `high` risk
  - professional review recommended

## What Is Still Out Of Scope

- live GIS or property API integration
- coordinate-based overlay intersection
- automated source refresh for parcel records

## Remaining Core MVP Milestones

After this milestone, `1` core MVP milestone remains:

- reviewer workflow states for human-in-the-loop escalation
