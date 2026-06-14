# Phase Complete: Supabase Bootstrap

Date: 2026-06-14

## Decision

Use Supabase as the fastest next-step production platform for this product phase.

## Why Supabase Fits Best Right Now

- the product already revolves around PostgreSQL-shaped data
- the current app needs database, auth, storage, and row-scoped tenant security more than cloud-specific infrastructure primitives
- the team can move from local JSON into a managed Postgres stack quickly without rewriting the workflow layer

## What Is Now Included

- Supabase schema in `supabase/schema.sql`
- seed export script in `src/platform/export-supabase.js`
- package script:

```bash
npm run db:export-supabase
```

- generated seed output path:

```text
runs/supabase/latest-seed.sql
```

## What This Enables

- a Supabase project can be provisioned with the current tenant, operator, case, session, and curation model
- current local pilot data can be exported into SQL for bootstrap import
- the app is now positioned to replace JSON repositories with Postgres-backed repositories incrementally

## Recommended Next Build Step

1. provision Supabase project in an Australia-capable region if available for the account
2. apply `supabase/schema.sql`
3. run `npm run db:export-supabase`
4. import the generated seed SQL
5. replace the JSON store implementations with Postgres-backed repository adapters
