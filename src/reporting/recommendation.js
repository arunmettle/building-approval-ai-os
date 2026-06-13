import { recommendationContract } from "../app/contracts/recommendation-contract.js";
import { resolveDocumentEvidence, resolveRequiredDocuments } from "./document-requirements.js";
import { retrieveRelevantChunks } from "../retrieval/search.js";
import { buildExplanation } from "./explanation.js";
import { validateNarrativeClaims } from "./claim-validator.js";

function uniqueEvidenceFromMatches(matches) {
  const bySourceClaim = new Map();

  for (const match of matches) {
    if (!match.evidence) {
      continue;
    }

    const key = `${match.evidence.sourceId}:${match.evidence.normalizedClaim}`;
    bySourceClaim.set(key, match.evidence);
  }

  return [...bySourceClaim.values()];
}

function deriveRiskReasons(assessment) {
  const reasons = [];

  if (assessment.unknowns.length > 0) {
    reasons.push("Some required inputs are unknown, which limits confidence.");
  }

  if (assessment.matchedRules.some((rule) => rule.outcome.includes("approval-required"))) {
    reasons.push("One or more jurisdiction rules indicate an approval or certifier pathway is likely required.");
  }

  if (assessment.matchedRules.some((rule) => rule.outcome.includes("no-building"))) {
    reasons.push("A matched rule suggests a lower-friction building pathway may apply if stated conditions are accurate.");
  }

  if (reasons.length === 0) {
    reasons.push("There is not yet enough matched rule evidence to support a stronger conclusion.");
  }

  return reasons;
}

function deriveAssumptions(input, assessment) {
  const assumptions = [];

  if (assessment.unknowns.length === 0) {
    assumptions.push("The supplied project dimensions and siting inputs are assumed accurate.");
  }

  if (!("zone" in input) || !input.zone) {
    assumptions.push("Zone-specific planning checks are not yet fully evaluated unless reflected in matched extracted rules.");
  }

  assumptions.push("This output is decision support only and not an approval decision.");
  return assumptions;
}

function buildCitations(matches) {
  return uniqueEvidenceFromMatches(matches).map((evidence) => ({
    citationType: "matched-rule",
    sourceId: evidence.sourceId,
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl,
    sectionRef: evidence.sectionRef,
    snippet: evidence.snippet,
    confidence: evidence.confidence,
    extractedAt: evidence.retrievedAt
  }));
}

function buildRetrievedContextCitations(retrievedContext, existingCitations) {
  const seen = new Set(existingCitations.map((citation) => `${citation.sourceUrl}:${citation.sectionRef || ""}:${citation.snippet}`));
  const citations = [];

  for (const passage of retrievedContext) {
    const snippet = passage.text.slice(0, 500);
    const key = `${passage.sourceUrl}:${passage.sourceName}:${snippet}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    citations.push({
      citationType: "retrieved-context",
      sourceId: passage.sourceId,
      sourceName: passage.sourceName,
      sourceUrl: passage.sourceUrl,
      sectionRef: passage.sourceName,
      snippet,
      confidence: Number(Math.min(0.85, Math.max(0.5, passage.score / 60)).toFixed(2)),
      extractedAt: null
    });
  }

  return citations;
}

function buildDocumentEvidenceCitations(documentEvidence, existingCitations) {
  const seen = new Set(existingCitations.map((citation) => `${citation.sourceUrl}:${citation.snippet}`));

  return documentEvidence.flatMap((item) => {
    const evidence = item.evidence;

    if (!evidence) {
      return [];
    }

    const key = `${evidence.sourceUrl}:${evidence.snippet}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [{
      citationType: "checklist-item",
      sourceId: evidence.sourceId,
      sourceName: evidence.sourceName,
      sourceUrl: evidence.sourceUrl,
      sectionRef: evidence.sectionRef,
      snippet: evidence.snippet,
      confidence: evidence.confidence,
      extractedAt: evidence.retrievedAt
    }];
  });
}

function assertContract(recommendation) {
  for (const field of recommendationContract.requiredFields) {
    if (!(field in recommendation)) {
      throw new Error(`Recommendation missing required field: ${field}`);
    }
  }

  if (!recommendationContract.allowedRiskRatings.includes(recommendation.riskRating)) {
    throw new Error(`Invalid risk rating: ${recommendation.riskRating}`);
  }
}

export function buildRecommendation(input, assessment) {
  const requiredDocuments = resolveRequiredDocuments(input, assessment);
  const documentEvidence = resolveDocumentEvidence(input, assessment);
  const retrievedContext = retrieveRelevantChunks(input, assessment);
  const matchedRuleCitations = buildCitations(assessment.matchedRules);
  const citations = [
    ...matchedRuleCitations,
    ...buildDocumentEvidenceCitations(documentEvidence, matchedRuleCitations),
    ...buildRetrievedContextCitations(
      retrievedContext,
      [...matchedRuleCitations, ...buildDocumentEvidenceCitations(documentEvidence, matchedRuleCitations)]
    )
  ];
  const explanation = buildExplanation(input, assessment, {
    citations,
    requiredDocuments,
    retrievedContext,
    pathwayLabel: assessment.pathwayLabel,
    professionalReviewRecommended: assessment.professionalReviewRecommended
  });
  const narrativeValidation = validateNarrativeClaims(explanation.sentences, citations);
  const recommendation = {
    jurisdiction: assessment.jurisdictionId,
    effectiveDate: new Date().toISOString().slice(0, 10),
    projectType: assessment.projectType,
    pathwayLabel: assessment.pathwayLabel,
    riskRating: assessment.riskRating,
    riskReasons: deriveRiskReasons(assessment),
    requiredDocuments,
    unknowns: assessment.unknowns,
    professionalReviewRecommended: assessment.professionalReviewRecommended,
    citations,
    retrievedContext,
    narrative: explanation.paragraphs,
    explanation,
    narrativeClaims: explanation.sentences,
    narrativeValidation,
    assumptions: deriveAssumptions(input, assessment),
    matchedRuleIds: assessment.matchedRules.map((rule) => rule.ruleId)
  };

  assertContract(recommendation);
  return recommendation;
}
