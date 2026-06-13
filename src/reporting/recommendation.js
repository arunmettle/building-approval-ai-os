import { recommendationContract } from "../app/contracts/recommendation-contract.js";
import { resolveRequiredDocuments } from "./document-requirements.js";
import { retrieveRelevantChunks } from "../retrieval/search.js";
import { buildNarrativeClaims, buildNarrativeParagraphs } from "./narrative.js";
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
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl,
    sectionRef: evidence.sectionRef,
    snippet: evidence.snippet,
    confidence: evidence.confidence,
    extractedAt: evidence.retrievedAt
  }));
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
  const citations = buildCitations(assessment.matchedRules);
  const requiredDocuments = resolveRequiredDocuments(input, assessment);
  const retrievedContext = retrieveRelevantChunks(input, assessment);
  const narrativeClaims = buildNarrativeClaims(input, assessment, {
    citations,
    requiredDocuments,
    retrievedContext,
    pathwayLabel: assessment.pathwayLabel,
    professionalReviewRecommended: assessment.professionalReviewRecommended
  });
  const narrativeValidation = validateNarrativeClaims(narrativeClaims, citations);
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
    narrative: buildNarrativeParagraphs(narrativeValidation.supportedClaims),
    narrativeClaims,
    narrativeValidation,
    assumptions: deriveAssumptions(input, assessment),
    matchedRuleIds: assessment.matchedRules.map((rule) => rule.ruleId)
  };

  assertContract(recommendation);
  return recommendation;
}
