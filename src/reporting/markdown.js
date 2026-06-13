function formatList(items) {
  if (!items.length) {
    return "- None";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatClaimList(claims) {
  if (!claims.length) {
    return "- None";
  }

  return claims
    .map(
      (claim) =>
        `- ${claim.text} [type=${claim.type}; citationRefs=${claim.citationRefs.length ? claim.citationRefs.join(", ") : "none"}]`
    )
    .join("\n");
}

export function buildMarkdownReport(input, assessment, recommendation) {
  const citations = recommendation.citations
    .map(
      (citation, index) =>
        `### Citation ${index + 1}\n- Source: ${citation.sourceName}\n- URL: ${citation.sourceUrl}\n- Section: ${citation.sectionRef || "Not captured"}\n- Confidence: ${citation.confidence}\n- Snippet: ${citation.snippet}`
    )
    .join("\n\n");

  const retrievedContext = (recommendation.retrievedContext || [])
    .map(
      (item, index) =>
        `### Retrieved Passage ${index + 1}\n- Source: ${item.sourceName}\n- URL: ${item.sourceUrl}\n- Score: ${item.score}\n- Lexical: ${item.lexicalScore}\n- Semantic: ${item.semanticScore}\n- Text: ${item.text}`
    )
    .join("\n\n");

  return [
    "# Building Approval AI OS Report",
    "",
    "## Project Summary",
    `- Jurisdiction: ${recommendation.jurisdiction}`,
    `- Project type: ${recommendation.projectType}`,
    `- Pathway: ${recommendation.pathwayLabel}`,
    `- Evidence-supported risk rating: ${recommendation.riskRating}`,
    `- Professional review recommended: ${recommendation.professionalReviewRecommended ? "Yes" : "No"}`,
    "",
    "## Input Snapshot",
    "```json",
    JSON.stringify(input, null, 2),
    "```",
    "",
    "## Risk Reasons",
    formatList(recommendation.riskReasons),
    "",
    "## Narrative Summary",
    formatList(recommendation.narrative || []),
    "",
    "## Potential Compliance Issues",
    formatList(
      assessment.matchedRules
        .filter((rule) => rule.outcome.includes("approval-required"))
        .map((rule) => `${rule.ruleId}: ${rule.outcome}`)
    ),
    "",
    "## Documents Likely Required",
    formatList(recommendation.requiredDocuments),
    "",
    "## Unknowns",
    formatList(recommendation.unknowns),
    "",
    "## Assumptions",
    formatList(recommendation.assumptions),
    "",
    "## Citations",
    citations || "No citations available.",
    "",
    "## Claim Validation",
    `- Status: ${recommendation.narrativeValidation?.status || "not-run"}`,
    formatClaimList(recommendation.narrativeClaims || []),
    "",
    "## Retrieved Context",
    retrievedContext || "No retrieved context available.",
    "",
    "## Disclaimer",
    "This report is evidence-based decision support only. It does not state that the project is approved, legally compliant, or guaranteed to obtain approval."
  ].join("\n");
}
