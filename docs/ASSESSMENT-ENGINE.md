# Deterministic Assessment Engine

## Purpose

The first useful product behavior is not a chatbot. It is a deterministic pre-check that can:

- apply extracted threshold rules
- identify triggered approval pathways
- surface unknowns
- recommend professional review when the facts are incomplete or a rule is triggered

## Version 1 Behavior

The initial engine:

1. loads extracted threshold rules
2. evaluates them against a supplied intake object
3. reports matched rules
4. reports unknown fields that block confident assessment
5. returns a simple pathway, risk, and checklist skeleton

## Current Limits

- no overlay graph evaluation yet
- no planning-scheme code evaluation yet
- no historical outcomes weighting yet
- no jurisdiction-specific document pack generation yet

## Why This Matters

This is the bridge between aggregation and product behavior.

Once this layer exists, the next iterations can improve:

- rule coverage
- evidence quality
- pathway specificity
- checklist generation
- citation-backed report output
