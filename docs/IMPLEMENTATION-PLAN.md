# Implementation Plan

## Phase 0

Establish the operating model.

- Fix the initial wedge.
- Define repository structure.
- Define research loop artifacts.
- Define product language and risk boundaries.

## Phase 1

Build the deterministic assessment spine.

- Property and project intake schema
- Jurisdiction profile model
- Permit taxonomy
- Rule evaluation contract
- Evidence record contract
- Recommendation output contract

## Phase 2

Build the evidence system.

- Source adapter framework
- Document ingestion pipeline
- Metadata and lineage storage
- Clause and snippet referencing
- Freshness and stale-source detection

## Phase 3

Build the assessor workflow.

- User intake flow
- Pre-check engine
- Risk scoring
- Missing document checklist
- Submission-readiness report

Status:
Core Phase 3 capabilities are now implemented in MVP form. Data collation is considered sufficient MVP infrastructure and is no longer the main blocker.

## Phase 4

Add AI synthesis safely.

- Evidence-only prompt contract
- Claim-to-citation validation
- Unknown handling
- Reviewer escalation logic

Status:
Deterministic evidence-backed narrative generation, claim validation, and reviewer escalation workflow states are now implemented in MVP form. Free-form LLM synthesis remains a future step.

## Phase 5

Operationalize.

- Admin curation portal
- Evaluation dashboards
- Pilot customer feedback loop
- Pricing tests

Status:
An operational console MVP is now implemented with tenant-scoped operator sessions, persistent reviewer queue workflows, and a production-shaped internal API surface. Admin curation and evaluation analytics remain future extensions.

## Immediate Technical Decision

The target production stack remains aligned to the blueprint: `ASP.NET Core`, `PostgreSQL`, object storage, background workers, and a React frontend.

This repository currently starts with Node-based scaffolding because the local environment does not have the `.NET` SDK installed. That constraint affects bootstrap mechanics, not the longer-term architecture.
