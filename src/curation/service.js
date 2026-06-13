import fs from "node:fs";
import crypto from "node:crypto";
import { listCases } from "../cases/repository.js";
import { getCurationReview, listCurationReviews, saveCurationReview } from "./repository.js";

function stableItemId(type, seed) {
  return `${type}-${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;
}

function readArtifactJson(jsonPath) {
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function candidateFromCitation(caseRecord, citation, index) {
  const seed = `${caseRecord.caseId}:${citation.sourceId || citation.sourceUrl}:${citation.sectionRef || ""}:${citation.snippet || ""}`;
  return {
    itemId: stableItemId("citation", seed),
    type: "citation",
    tenantId: caseRecord.tenantId,
    title: citation.sourceName || `Citation ${index + 1}`,
    description: citation.snippet || "Citation snippet not available.",
    sourceName: citation.sourceName || null,
    sourceUrl: citation.sourceUrl || null,
    evidence: {
      sectionRef: citation.sectionRef || null,
      snippet: citation.snippet || null,
      confidence: citation.confidence ?? null
    },
    linkedCaseIds: [caseRecord.caseId],
    signals: {
      citationType: citation.citationType || "unknown"
    }
  };
}

function candidateFromRule(caseRecord, rule) {
  const seed = `${caseRecord.caseId}:${rule.ruleId}:${rule.outcome}`;
  return {
    itemId: stableItemId("rule", seed),
    type: "matched-rule",
    tenantId: caseRecord.tenantId,
    title: rule.ruleId,
    description: `${rule.outcome} (${rule.projectType || caseRecord.projectType})`,
    sourceName: rule.evidence?.sourceName || null,
    sourceUrl: rule.evidence?.sourceUrl || null,
    evidence: {
      sectionRef: rule.evidence?.sectionRef || null,
      snippet: rule.evidence?.snippet || null,
      confidence: rule.evidence?.confidence ?? null
    },
    linkedCaseIds: [caseRecord.caseId],
    signals: {
      outcome: rule.outcome,
      matched: Boolean(rule.matched)
    }
  };
}

function candidateFromClaim(caseRecord, claim, validationResult) {
  const seed = `${caseRecord.caseId}:${claim.sentenceId || claim.claimId}:${claim.sentence}`;
  return {
    itemId: stableItemId("claim", seed),
    type: "narrative-claim",
    tenantId: caseRecord.tenantId,
    title: claim.type || "Narrative claim",
    description: claim.sentence,
    sourceName: null,
    sourceUrl: null,
    evidence: {
      sectionRef: null,
      snippet: claim.sentence,
      confidence: validationResult?.supported ? 1 : 0.25
    },
    linkedCaseIds: [caseRecord.caseId],
    signals: {
      supported: Boolean(validationResult?.supported),
      citationRefs: claim.citationRefs?.length || 0
    }
  };
}

function mergeCandidate(target, candidate) {
  const linked = new Set([...(target.linkedCaseIds || []), ...(candidate.linkedCaseIds || [])]);
  return {
    ...target,
    linkedCaseIds: [...linked]
  };
}

function collectCandidateMapForTenant(tenantId) {
  const cases = listCases(tenantId);
  const byId = new Map();

  for (const caseRecord of cases) {
    const artifact = readArtifactJson(caseRecord.latestArtifact?.jsonPath);

    if (!artifact?.recommendation || !artifact?.assessment) {
      continue;
    }

    const recommendation = artifact.recommendation;
    const assessment = artifact.assessment;

    (recommendation.citations || []).forEach((citation, index) => {
      const candidate = candidateFromCitation(caseRecord, citation, index);
      byId.set(candidate.itemId, byId.has(candidate.itemId) ? mergeCandidate(byId.get(candidate.itemId), candidate) : candidate);
    });

    (assessment.matchedRules || []).forEach((rule) => {
      const candidate = candidateFromRule(caseRecord, rule);
      byId.set(candidate.itemId, byId.has(candidate.itemId) ? mergeCandidate(byId.get(candidate.itemId), candidate) : candidate);
    });

    const validationIndex = new Map((recommendation.narrativeValidation?.results || []).map((result) => [result.claimId, result]));
    (recommendation.narrativeClaims || []).forEach((claim) => {
      const validationResult = validationIndex.get(claim.sentenceId || claim.claimId);
      if (validationResult?.supported === false) {
        const candidate = candidateFromClaim(caseRecord, claim, validationResult);
        byId.set(candidate.itemId, byId.has(candidate.itemId) ? mergeCandidate(byId.get(candidate.itemId), candidate) : candidate);
      }
    });
  }

  return byId;
}

function applyFilters(item, filters) {
  if (filters.status && item.reviewStatus !== filters.status) {
    return false;
  }

  if (filters.type && item.type !== filters.type) {
    return false;
  }

  return true;
}

export function listCurationItems(sessionContext, filters = {}) {
  const reviews = listCurationReviews(sessionContext.tenantId);
  const reviewMap = new Map(reviews.map((review) => [review.itemId, review]));
  const candidates = [...collectCandidateMapForTenant(sessionContext.tenantId).values()]
    .map((candidate) => {
      const review = reviewMap.get(candidate.itemId);
      return {
        ...candidate,
        reviewStatus: review?.status || "open",
        reviewDisposition: review?.disposition || null,
        reviewNote: review?.note || null,
        correctedValue: review?.correctedValue || null,
        reviewedAt: review?.reviewedAt || null,
        reviewedBy: review?.reviewedBy || null
      };
    })
    .filter((item) => applyFilters(item, filters))
    .sort((a, b) => {
      if (a.reviewStatus !== b.reviewStatus) {
        return a.reviewStatus === "open" ? -1 : 1;
      }
      return b.linkedCaseIds.length - a.linkedCaseIds.length;
    });

  return {
    items: candidates,
    metrics: {
      total: candidates.length,
      open: candidates.filter((item) => item.reviewStatus === "open").length,
      accepted: candidates.filter((item) => item.reviewDisposition === "accepted").length,
      corrected: candidates.filter((item) => item.reviewDisposition === "corrected").length,
      dismissed: candidates.filter((item) => item.reviewDisposition === "dismissed").length
    }
  };
}

export function reviewCurationItem(itemId, payload, sessionContext) {
  const candidate = collectCandidateMapForTenant(sessionContext.tenantId).get(itemId);

  if (!candidate) {
    throw new Error(`Curation item not found: ${itemId}`);
  }

  const now = new Date().toISOString();
  const review = {
    itemId,
    tenantId: sessionContext.tenantId,
    status: payload.status || "reviewed",
    disposition: payload.disposition || "accepted",
    note: payload.note || null,
    correctedValue: payload.correctedValue || null,
    reviewedAt: now,
    reviewedBy: {
      operatorId: sessionContext.operator.operatorId,
      displayName: sessionContext.operator.displayName,
      role: sessionContext.operator.role
    }
  };

  saveCurationReview(review);
  return {
    ...candidate,
    reviewStatus: review.status,
    reviewDisposition: review.disposition,
    reviewNote: review.note,
    correctedValue: review.correctedValue,
    reviewedAt: review.reviewedAt,
    reviewedBy: review.reviewedBy
  };
}

export function getEvaluationDashboard(sessionContext) {
  const cases = listCases(sessionContext.tenantId);
  const curation = listCurationItems(sessionContext, {});

  let totalNarrativeClaims = 0;
  let unsupportedClaims = 0;
  let totalCitations = 0;
  let assessedArtifacts = 0;
  let reviewerNotes = 0;
  let reassessedCases = 0;

  for (const caseRecord of cases) {
    reviewerNotes += (caseRecord.reviewerNotes || []).length;
    reassessedCases += (caseRecord.workflowHistory || []).filter((event) => event.type === "case-reassessed").length;

    const artifact = readArtifactJson(caseRecord.latestArtifact?.jsonPath);
    if (!artifact?.recommendation) {
      continue;
    }

    assessedArtifacts += 1;
    totalCitations += (artifact.recommendation.citations || []).length;
    totalNarrativeClaims += (artifact.recommendation.narrativeClaims || []).length;
    unsupportedClaims += (artifact.recommendation.narrativeValidation?.results || []).filter((result) => !result.supported).length;
  }

  return {
    tenantId: sessionContext.tenantId,
    caseMetrics: {
      totalCases: cases.length,
      highRisk: cases.filter((item) => item.riskRating === "high").length,
      professionalReviewRequired: cases.filter((item) => item.reviewerWorkflow?.state === "professional-review-required").length,
      pendingDocuments: cases.filter((item) => item.reviewerWorkflow?.state === "pending-documents").length,
      assignedCases: cases.filter((item) => item.assignedReviewerId).length,
      reviewerNotes,
      reassessedCases
    },
    qualityMetrics: {
      averageCitationsPerCase: assessedArtifacts ? Number((totalCitations / assessedArtifacts).toFixed(2)) : 0,
      unsupportedClaims,
      totalNarrativeClaims,
      unsupportedClaimRate: totalNarrativeClaims ? Number((unsupportedClaims / totalNarrativeClaims).toFixed(3)) : 0
    },
    curationMetrics: curation.metrics
  };
}
