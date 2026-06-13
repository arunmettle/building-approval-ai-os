# Research Run 002

Date: 2026-06-13

## Objective

Select the first Queensland pilot councils using current official sources and convert that selection into implementation-ready jurisdiction artifacts.

## Findings

### Brisbane City Council

- Strong property and planning lookup path through City Plan Online.
- Good task-specific residential pages for decks and sheds.
- Development.i provides historical and current application visibility.
- Open data presence improves future automation options.

### City of Moreton Bay

- Good combination of planning scheme pages, practical guidance, property lookup, and mapping.
- Strong fit for structures such as patios and outbuildings.
- DataHub suggests future GIS and overlay ingestion opportunities.

### Sunshine Coast Council

- Best explicit threshold wording among reviewed councils for the target permit class.
- Good property mapping and Development.i integration.
- Open data and building search pathways make evidence and historical workflows feasible.

### Gold Coast

- Strong backup candidate with accessible pages, but less immediately attractive than the top three for the first cycle.

## Decisions Made

- Pilot councils selected: Brisbane, Moreton Bay, Sunshine Coast.
- Gold Coast moved to the reserve list.
- Queensland state-level requirements should be ingested as a reusable baseline layer, not duplicated per council.

## Assumptions Retired

- It is feasible to choose an initial Queensland wedge using current public official sources.
- The selected councils have enough publicly visible guidance to start deterministic pre-check modeling.

## New Assumptions

- The selected councils will provide enough overlay, zoning, and historical data access for property-specific report quality.
- The common state baseline plus council deltas will cover most early deterministic logic.

## Build Consequences

- Create jurisdiction profile artifacts for the selected councils.
- Model state baseline sources separately from council-specific sources.
- Move the research loop toward permit-threshold extraction and intake-schema design.

## Next Questions

1. Which exact intake fields are required to evaluate the most common deck, pergola, shed, and patio scenarios?
2. Which council-specific overlays most often escalate a simple pre-check into professional review?
3. What minimum evidence bundle is needed for a report that an installer will trust and a certifier can review quickly?
