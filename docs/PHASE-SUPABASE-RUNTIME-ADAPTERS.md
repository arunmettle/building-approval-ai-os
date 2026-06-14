# Phase Complete: Supabase Runtime Adapters

Date: 2026-06-14

## Objective

Move beyond Supabase bootstrap assets and make the running application capable of using Supabase-backed persistence.

## What Is Now Included

- optional Supabase REST client in `src/platform/supabase-client.js`
- async repository paths for:
  - sessions
  - cases
  - curation reviews
- seeded operator fallback with Supabase operator loading support
- server and service layers updated for async persistence

## Runtime Activation

Set both environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Without them, the app keeps using local JSON repositories.

## What This Enables

- the current internal console can run against managed Postgres-backed persistence without changing UI or workflow logic
- the same repository interfaces still work locally for fast development
- migration to real Supabase-backed data can happen incrementally by environment instead of by branch

## Remaining Post-Phase Priorities

- replace seeded operator login with real Supabase Auth session flows
- move property fixtures and lookup outputs into database-backed tables
- add RLS policy scripts and tenant-aware JWT integration
