# Phase Complete: Infrastructure Enablement

Date: 2026-06-14

## Objective

Finish the next phase by making the application layer replaceable rather than hard-wired, specifically for:

- persistence
- role and access policy
- property lookup integration

## What Is Now Included

- shared JSON store abstraction used by app repositories
- role-based permission policy for operator sessions and API actions
- property lookup adapter registry with fixture mode and official council portal handoff mode
- production-shaped API boundary for property lookup

## What This Enablement Helps With

- lets the team replace local JSON stores with PostgreSQL or another datastore without rewriting case, auth, or curation workflows
- lets seeded demo identities be replaced with real identity providers and RBAC while preserving the current console and API behavior
- lets pilot councils move from fixture property profiles to automated live lookup adapters without changing assessment/reporting contracts
- reduces product risk because infrastructure swaps no longer require redesigning the workflow and evidence layers

## Runtime Entry Point

Run:

```bash
npm run app:start
```

Open:

```text
http://127.0.0.1:4010
```

## API Additions

- `GET /api/property/lookup`

## Official Lookup Sources Wired Into Adapter Metadata

- Sunshine Coast Development.i site report
- Sunshine Coast interactive mapping
- City of Moreton Bay My Property Look Up
- Brisbane City Plan online

## Remaining Post-Phase Priorities

- add real database persistence
- connect to real identity and tenant services
- automate property enrichment against council data sources instead of portal handoff
