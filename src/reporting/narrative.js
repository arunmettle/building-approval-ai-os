function buildClaim({
  claimId,
  type,
  text,
  rationale,
  citationRefs,
  confidence
}) {
  return {
    claimId,
    type,
    text,
    rationale,
    citationRefs,
    confidence
  };
}

function buildCitationIndex(citations) {
  const bySourceName = new Map();

  citations.forEach((citation, index) => {
    if (!bySourceName.has(citation.sourceName)) {
      bySourceName.set(citation.sourceName, []);
    }

    bySourceName.get(citation.sourceName).push(index);
  });

  return bySourceName;
}

function addRetrievedCitationRefs(retrievedContext, citations, citationIndex) {
  const refs = [];

  for (const passage of retrievedContext || []) {
    const indices = citationIndex.get(passage.sourceName);

    if (indices?.length) {
      refs.push(...indices);
    }
  }

  return [...new Set(refs)];
}

export function buildNarrativeClaims(input, assessment, recommendation) {
  const citationIndex = buildCitationIndex(recommendation.citations);
  const claims = [];

  if (assessment.matchedRules.length > 0) {
    const refs = addRetrievedCitationRefs(
      assessment.matchedRules.map((rule) => ({
        sourceName: rule.evidence?.sourceName
      })),
      recommendation.citations,
      citationIndex
    );

    claims.push(
      buildClaim({
        claimId: "pathway-claim",
        type: "pathway",
        text: `${recommendation.pathwayLabel}.`,
        rationale: "This claim is based on matched deterministic rules for the selected jurisdiction and project type.",
        citationRefs: refs,
        confidence: 0.88
      })
    );
  }

  if (assessment.unknowns.length > 0) {
    claims.push(
      buildClaim({
        claimId: "unknowns-claim",
        type: "unknowns",
        text: `The current assessment is constrained by missing information: ${assessment.unknowns.join(", ")}.`,
        rationale: "Unknown intake fields block higher-confidence pathway and compliance assessment.",
        citationRefs: [],
        confidence: 0.7
      })
    );
  }

  if (recommendation.requiredDocuments.length > 0) {
    const refs = addRetrievedCitationRefs(
      recommendation.retrievedContext,
      recommendation.citations,
      citationIndex
    );

    claims.push(
      buildClaim({
        claimId: "documents-claim",
        type: "documents",
        text: `The project is likely to require supporting materials such as ${recommendation.requiredDocuments.slice(0, 5).join(", ")}${recommendation.requiredDocuments.length > 5 ? ", and related supporting documents" : ""}.`,
        rationale: "This claim is derived from extracted checklist items and supporting retrieved guidance for the jurisdiction.",
        citationRefs: refs,
        confidence: 0.78
      })
    );
  }

  if (recommendation.professionalReviewRecommended) {
    claims.push(
      buildClaim({
        claimId: "review-claim",
        type: "review",
        text: "Professional review is recommended before relying on this pathway outcome.",
        rationale: "This follows from either approval-triggering rules or unresolved unknowns in the intake.",
        citationRefs: [],
        confidence: 0.82
      })
    );
  } else {
    const refs = addRetrievedCitationRefs(recommendation.retrievedContext, recommendation.citations, citationIndex);

    claims.push(
      buildClaim({
        claimId: "review-claim",
        type: "review",
        text: "A private certifier or professional review may still be useful if site-specific overlays, services, or siting details are uncertain.",
        rationale: "Even low-friction pathways can change if site-specific planning or siting constraints apply.",
        citationRefs: refs,
        confidence: 0.72
      })
    );
  }

  return claims;
}

export function buildNarrativeParagraphs(claims) {
  return claims.map((claim) => claim.text);
}
