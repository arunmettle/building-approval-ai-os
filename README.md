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
- `src/server/` for the internal pilot HTTP app
- `src/web/` for the operator console UI
- `src/cases/` for persistent case storage and assessment orchestration
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

- create an assessment case from intake data
- persist cases locally
- reassess existing cases
- review workflow states, blockers, and actions
- assign reviewers and store reviewer notes

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
