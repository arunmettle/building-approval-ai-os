# Phase Complete: Internal Pilot App

Date: 2026-06-13

## Objective

Turn the repository from a backend/reporting prototype into a usable internal pilot product with:

- persistent cases
- API endpoints
- operator UI
- reviewer workflow handling

## What Is Now Included

- persistent local case storage
- case creation and reassessment APIs
- reviewer assignment and notes updates
- local operator console UI
- parcel-aware assessment and reviewer workflow routing

## Main Runtime Entry Point

Run:

```bash
npm run app:start
```

Open:

```text
http://127.0.0.1:4010
```

## Core App Flows

1. Create a case from intake data
2. Resolve parcel context when a property profile exists
3. Assess pathway and risk
4. Build recommendation, evidence, and report artifacts
5. Persist reviewer workflow state
6. Allow reviewer reassessment, assignment, and notes updates

## Remaining Post-MVP Priorities

- replace local property fixtures with live council/property adapters
- persist reviewer queue assignment semantics beyond case-local notes
- add authentication and tenant separation
- expose a cleaner production API boundary
- build a richer frontend for pilot users
