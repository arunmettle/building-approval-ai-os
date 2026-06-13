# Milestone Complete: Reviewer Workflow States

Date: 2026-06-13

## Milestone Objective

Add explicit reviewer workflow states so cases can be routed through human-in-the-loop escalation paths instead of exposing only a single professional-review boolean.

## Completion Criteria

- recommendation output contains a reviewer workflow object
- workflow includes state, priority, blockers, actions, and escalation reasons
- workflow is derived from parcel context, unknowns, document status, and assessment risk
- report output exposes the workflow state clearly
- example output demonstrates a non-trivial review path

## What Was Added

- reviewer workflow builder in `src/review/workflow.js`
- recommendation contract update in `src/app/contracts/recommendation-contract.js`
- recommendation integration in `src/reporting/recommendation.js`
- report rendering in `src/reporting/markdown.js`

## States

Current workflow states:

- `needs-intake-clarification`
- `pending-documents`
- `professional-review-required`
- `ready-for-submission-pack`

## Outcome

- overlay-sensitive or high-risk parcels can now route into `professional-review-required`
- missing core documents can route into `pending-documents`
- unknown intake values can route into `needs-intake-clarification`
- lower-friction complete cases can route into `ready-for-submission-pack`

## Core MVP Status

This completes the last core MVP milestone in the current build sequence.
