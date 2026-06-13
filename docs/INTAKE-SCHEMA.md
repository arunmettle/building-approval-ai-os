# Initial Intake Schema

## Purpose

This is the first-pass intake contract for the Queensland installer wedge covering decks, pergolas, sheds, and patios.

The goal is not to collect every possible detail up front. The goal is to collect enough information to:

- resolve jurisdiction
- detect likely accepted-development cases
- detect likely planning or siting escalations
- identify missing information
- trigger professional review when needed

## Core Property Inputs

- street address
- lot and plan if available
- coordinates if available
- local authority override
- current use of property
- zone
- overlays
- easement known or unknown
- pool enclosure nearby
- existing retaining wall nearby

## Core Project Inputs

- permit type
- attached or detached
- roofed or unroofed
- intended use
- plan area square metres
- longest side metres
- maximum height metres
- mean height metres
- distance to front boundary
- distance to side boundary
- distance to rear boundary
- located over or near infrastructure
- involves excavation or fill
- affects existing structure

## Document Readiness Inputs

- site plan available
- dimensioned sketch or drawing available
- engineering documentation available
- owner consent available
- existing approvals or prior records available
- photos of proposed site available

## Why These Fields Exist

The selected Queensland sources repeatedly point to a common decision pattern:

- small structure dimensions drive accepted-development checks
- siting and boundary conditions drive certifier or council referral
- overlays and neighbourhood or local plan context can change the pathway
- infrastructure, pool fences, retaining walls, and structural impacts create escalation risk
- documentation completeness affects whether an application can be prepared cleanly

## First-Pass Missing Information Logic

Professional review should be recommended when any of the following remain unknown:

- property zone
- overlays
- boundary setbacks
- structure height
- structure area
- easement or infrastructure conflict
- impact on pool enclosure
- impact on retaining walls or existing structures

## Design Rule

If a field can materially change the pathway, risk rating, or required documents, it belongs in intake.
