# Building Approval AI OS

Evidence-based decision-support and submission-readiness platform for building approvals, planning permits, development applications, and construction compliance workflows.

## Current Direction

This repository starts with a narrow execution wedge instead of a global rollout:

- Country: Australia
- Initial segment: installers and certifier-support workflows
- Initial permit categories: decks, pergolas, sheds, patios
- Initial motion: evidence-backed pre-checks and submission-readiness

The system is designed to support professionals and applicants. It does not act as an approval authority and does not guarantee approval or legal compliance.

## What Exists In This Repo

- `docs/` for execution plans, research operating model, and backlog
- `src/research-loop/` for an automated research loop scaffold
- `src/app/` for core domain contracts and product foundations
- `src/auth/` for seeded operator identities and session handling
- `src/curation/` for evidence review records and evaluation metrics
- `src/platform/` for shared persistence primitives
- `src/server/` for the internal pilot HTTP app
- `src/web/` for the operator console UI
- `src/cases/` for persistent case storage and assessment orchestration
- `src/property/` for property lookup fixtures and adapter scaffolding
- `runs/` for generated research cycle outputs

## Internal Pilot App

Start the internal pilot app:

```bash
npm run app:start
```

Then open:

```text
http://127.0.0.1:4010
```

The app currently supports:

- tenant-scoped operator sign-in
- role-aware API permissions for intake, reviewer, and certifier-lead flows
- reviewer queue filters and workload metrics
- evaluation dashboard metrics from persisted case artifacts
- curation queue for citations, matched rules, and unsupported claims
- property lookup adapter scaffolding with official council portal handoff metadata
- create an assessment case from intake data
- persist cases locally
- reassess existing cases
- review workflow states, blockers, and actions
- assign reviewers and store reviewer notes
- track workflow history per case

Demo credentials:

- `intake@sunrise-installers.demo` / `sunrise-intake`
- `review@sunrise-installers.demo` / `sunrise-review`
- `ops@qld-certifier.demo` / `certifier-ops`
- `review@qld-certifier.demo` / `certifier-review`

Additional API endpoints:

- `GET /api/property/lookup`
- `GET /api/evaluation/dashboard`
- `GET /api/curation/items`

## Research Loop

Run the autoresearch loop:

```bash
node src/research-loop/index.js
```

This produces a timestamped markdown report under `runs/` from the current strategic assumptions and backlog.

## Immediate Priorities

1. Validate the first wedge and target buyer with real market interviews.
2. Build the jurisdiction data model around a small number of councils.
3. Stand up deterministic pre-check logic before any generative workflow.
4. Add evidence retrieval and citation validation before user-facing recommendations.

## Constraints

- Recommendations must be evidence-backed.
- Jurisdiction and effective date are mandatory dimensions for rules.
- Human review remains part of the workflow for regulated outputs.
- Product language must avoid claims of approval, legality, or guarantees.
