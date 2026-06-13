# Phase Complete: Operations Console

Date: 2026-06-14

## Objective

Finish the next product phase by turning the internal pilot app into an operational console with:

- tenant-scoped operator sessions
- persistent reviewer queue workflows
- assignment and workflow transition tracking
- a cleaner internal API surface for queue and session operations

## What Is Now Included

- seeded operator identities for multiple pilot tenants
- login, session restore, and logout flows
- tenant-aware case access boundaries
- queue metrics and filters
- reviewer assignment by operator identity
- workflow history persisted on each case

## Main Runtime Entry Point

Run:

```bash
npm run app:start
```

Open:

```text
http://127.0.0.1:4010
```

## Demo Credentials

- `intake@sunrise-installers.demo` / `sunrise-intake`
- `review@sunrise-installers.demo` / `sunrise-review`
- `ops@qld-certifier.demo` / `certifier-ops`
- `review@qld-certifier.demo` / `certifier-review`

## Operational API Additions

- `POST /api/session/login`
- `GET /api/session`
- `POST /api/session/logout`
- `GET /api/operators`
- `GET /api/queue`

## Remaining Post-Phase Priorities

- replace local fixture auth with real identity and RBAC
- replace local property fixtures with live council/property adapters
- add admin evidence-curation workflows
- add evaluation dashboards and correction analytics
