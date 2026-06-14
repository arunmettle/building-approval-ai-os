import { recommendationContract } from "../app/contracts/recommendation-contract.js";
import { resolveDocumentEvidence, resolveRequiredDocuments } from "./document-requirements.js";
import { retrieveRelevantChunks } from "../retrieval/search.js";
import { buildExplanation } from "./explanation.js";
import { validateNarrativeClaims } from "./claim-validator.js";
import { buildReviewerWorkflow } from "../review/workflow.js";

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

  if (assessment.propertyProfile?.overlays?.length) {
    reasons.push(
      `Resolved property overlays may affect the pathway: ${assessment.propertyProfile.overlays.join(", ")}.`
    );
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
  const effectiveInput = assessment.input || input;
  const requiredDocuments = resolveRequiredDocuments(effectiveInput, assessment);
  const documentEvidence = resolveDocumentEvidence(effectiveInput, assessment);
  const retrievedContext = retrieveRelevantChunks(effectiveInput, assessment);
  const matchedRuleCitations = buildCitations(assessment.matchedRules);
  const citations = [
    ...matchedRuleCitations,
    ...buildDocumentEvidenceCitations(documentEvidence, matchedRuleCitations),
    ...buildRetrievedContextCitations(
      retrievedContext,
      [...matchedRuleCitations, ...buildDocumentEvidenceCitations(documentEvidence, matchedRuleCitations)]
    )
  ];
  const explanation = buildExplanation(effectiveInput, assessment, {
    citations,
    requiredDocuments,
    retrievedContext,
    pathwayLabel: assessment.pathwayLabel,
    professionalReviewRecommended: assessment.professionalReviewRecommended
  });
  const narrativeValidation = validateNarrativeClaims(explanation.sentences, citations);
  const reviewerWorkflow = buildReviewerWorkflow(effectiveInput, assessment, requiredDocuments);
  const recommendation = {
    jurisdiction: assessment.jurisdictionId,
    effectiveDate: new Date().toISOString().slice(0, 10),
    projectType: assessment.projectType,
    pathwayLabel: assessment.pathwayLabel,
    riskRating: assessment.riskRating,
    riskReasons: deriveRiskReasons(assessment),
    propertyContext: assessment.propertyProfile
      ? {
          propertyProfileId: assessment.propertyProfile.propertyProfileId,
          address: assessment.propertyProfile.address,
          lotPlan: assessment.propertyProfile.lotPlan || null,
          zone: assessment.propertyProfile.zone,
          overlays: assessment.propertyProfile.overlays,
          currentUse: assessment.propertyProfile.currentUse || null,
          sources: assessment.propertyLookup?.sources || assessment.propertyProfile.sources || [],
          lookupStatus: assessment.propertyLookup?.status || "resolved",
          lookupAdapterId: assessment.propertyLookup?.adapterId || "fixture-profiles",
          searchHints: assessment.propertyLookup?.searchHints || null
        }
      : null,
    requiredDocuments,
    unknowns: assessment.unknowns,
    professionalReviewRecommended: assessment.professionalReviewRecommended,
    reviewerWorkflow,
    citations,
    retrievedContext,
    narrative: explanation.paragraphs,
    explanation,
    narrativeClaims: explanation.sentences,
    narrativeValidation,
    assumptions: deriveAssumptions(effectiveInput, assessment),
    matchedRuleIds: assessment.matchedRules.map((rule) => rule.ruleId)
  };

  assertContract(recommendation);
  return recommendation;
}
