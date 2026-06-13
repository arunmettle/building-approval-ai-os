import fs from "node:fs";
import path from "node:path";
import { assessProject } from "../assessment/engine.js";
import { buildRecommendation } from "../reporting/recommendation.js";
import { buildMarkdownReport } from "../reporting/markdown.js";
import { getCaseById, listCases, nextCaseId, saveCase } from "./repository.js";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function summarizeCase(caseRecord) {
  return {
    caseId: caseRecord.caseId,
    tenantId: caseRecord.tenantId,
    createdAt: caseRecord.createdAt,
    updatedAt: caseRecord.updatedAt,
    projectType: caseRecord.projectType,
    jurisdictionId: caseRecord.jurisdictionId,
    address: caseRecord.address,
    pathwayLabel: caseRecord.pathwayLabel,
    riskRating: caseRecord.riskRating,
    workflowState: caseRecord.reviewerWorkflow.state,
    workflowPriority: caseRecord.reviewerWorkflow.priority,
    assignedReviewer: caseRecord.assignedReviewer || null,
    assignedReviewerId: caseRecord.assignedReviewerId || null,
    professionalReviewRecommended: caseRecord.professionalReviewRecommended
  };
}

function writeCaseArtifacts(caseId, input, assessment, recommendation) {
  const outputDir = path.resolve(process.cwd(), "runs", "cases", caseId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  ensureDir(outputDir);

  const jsonPath = path.join(outputDir, `case-report-${stamp}.json`);
  const mdPath = path.join(outputDir, `case-report-${stamp}.md`);
  const markdown = buildMarkdownReport(input, assessment, recommendation);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ input, assessment, recommendation }, null, 2),
    "utf8"
  );
  fs.writeFileSync(mdPath, markdown, "utf8");

  return { jsonPath, mdPath, generatedAt: new Date().toISOString() };
}

function appendWorkflowEvent(history, event) {
  return [...(history || []), event];
}

function buildWorkflowEvent(type, actor, detail) {
  return {
    type,
    createdAt: new Date().toISOString(),
    actor: actor
      ? {
          operatorId: actor.operatorId,
          displayName: actor.displayName,
          role: actor.role
        }
      : null,
    detail
  };
}

function buildCaseRecord({ caseId, input, assessment, recommendation, priorCase, actor, tenantId, workflowEvent }) {
  const now = new Date().toISOString();
  const artifact = writeCaseArtifacts(caseId, assessment.input || input, assessment, recommendation);
  const history = appendWorkflowEvent(priorCase?.workflowHistory, workflowEvent);

  return {
    caseId,
    tenantId,
    createdAt: priorCase?.createdAt || now,
    updatedAt: now,
    createdBy: priorCase?.createdBy || (actor ? {
      operatorId: actor.operatorId,
      displayName: actor.displayName,
      email: actor.email
    } : null),
    projectType: recommendation.projectType,
    jurisdictionId: recommendation.jurisdiction,
    address: recommendation.propertyContext?.address || (assessment.input || input).address || null,
    input: assessment.input || input,
    originalInput: input,
    propertyContext: recommendation.propertyContext,
    pathwayLabel: recommendation.pathwayLabel,
    riskRating: recommendation.riskRating,
    professionalReviewRecommended: recommendation.professionalReviewRecommended,
    reviewerWorkflow: recommendation.reviewerWorkflow,
    requiredDocuments: recommendation.requiredDocuments,
    unknowns: recommendation.unknowns,
    assignedReviewer: priorCase?.assignedReviewer || null,
    assignedReviewerId: priorCase?.assignedReviewerId || null,
    reviewerNotes: priorCase?.reviewerNotes || [],
    workflowHistory: history,
    latestArtifact: artifact
  };
}

function filterQueueItem(item, filters, actor) {
  if (filters.state && item.workflowState !== filters.state) {
    return false;
  }

  if (filters.priority && item.workflowPriority !== filters.priority) {
    return false;
  }

  if (filters.projectType && item.projectType !== filters.projectType) {
    return false;
  }

  if (filters.assignment === "mine" && item.assignedReviewerId !== actor.operatorId) {
    return false;
  }

  if (filters.assignment === "unassigned" && item.assignedReviewerId) {
    return false;
  }

  return true;
}

export function createCaseFromInput(input, sessionContext) {
  const caseId = nextCaseId();
  const assessment = assessProject(input);
  const effectiveInput = assessment.input || input;
  const recommendation = buildRecommendation(effectiveInput, assessment);
  const caseRecord = buildCaseRecord({
    caseId,
    input,
    assessment,
    recommendation,
    priorCase: null,
    actor: sessionContext.operator,
    tenantId: sessionContext.tenantId,
    workflowEvent: buildWorkflowEvent("case-created", sessionContext.operator, {
      riskRating: recommendation.riskRating,
      workflowState: recommendation.reviewerWorkflow.state
    })
  });

  saveCase(caseRecord);
  return caseRecord;
}

export function reassessCase(caseId, sessionContext) {
  const existing = getCaseById(caseId, sessionContext.tenantId);

  if (!existing) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const assessment = assessProject(existing.originalInput || existing.input);
  const effectiveInput = assessment.input || existing.input;
  const recommendation = buildRecommendation(effectiveInput, assessment);
  const updated = buildCaseRecord({
    caseId,
    input: existing.originalInput || existing.input,
    assessment,
    recommendation,
    priorCase: existing,
    actor: sessionContext.operator,
    tenantId: existing.tenantId,
    workflowEvent: buildWorkflowEvent("case-reassessed", sessionContext.operator, {
      priorState: existing.reviewerWorkflow.state,
      newState: recommendation.reviewerWorkflow.state,
      priorRisk: existing.riskRating,
      newRisk: recommendation.riskRating
    })
  });

  updated.assignedReviewer = existing.assignedReviewer;
  updated.assignedReviewerId = existing.assignedReviewerId;
  updated.reviewerNotes = existing.reviewerNotes || [];

  saveCase(updated);
  return updated;
}

export function updateReviewerState(caseId, payload, sessionContext) {
  const existing = getCaseById(caseId, sessionContext.tenantId);

  if (!existing) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const now = new Date().toISOString();
  const reviewerNotes = [...(existing.reviewerNotes || [])];

  if (payload.note) {
    reviewerNotes.push({
      createdAt: now,
      author: payload.author || sessionContext.operator.displayName || "reviewer",
      note: payload.note
    });
  }

  const updated = {
    ...existing,
    updatedAt: now,
    assignedReviewer: payload.assignedReviewer ?? existing.assignedReviewer ?? null,
    assignedReviewerId: payload.assignedReviewerId ?? existing.assignedReviewerId ?? null,
    reviewerWorkflow: {
      ...existing.reviewerWorkflow,
      state: payload.state || existing.reviewerWorkflow.state,
      priority: payload.priority || existing.reviewerWorkflow.priority,
      blockingItems: payload.blockingItems || existing.reviewerWorkflow.blockingItems,
      requiredActions: payload.requiredActions || existing.reviewerWorkflow.requiredActions,
      escalationReasons: payload.escalationReasons || existing.reviewerWorkflow.escalationReasons
    },
    reviewerNotes,
    workflowHistory: appendWorkflowEvent(existing.workflowHistory, buildWorkflowEvent(
      "reviewer-updated",
      sessionContext.operator,
      {
        state: payload.state || existing.reviewerWorkflow.state,
        assignedReviewerId: payload.assignedReviewerId ?? existing.assignedReviewerId ?? null,
        assignedReviewer: payload.assignedReviewer ?? existing.assignedReviewer ?? null
      }
    ))
  };

  saveCase(updated);
  return updated;
}

export function getCaseDetail(caseId, sessionContext) {
  return getCaseById(caseId, sessionContext.tenantId);
}

export function listCaseSummaries(sessionContext) {
  return listCases(sessionContext.tenantId).map(summarizeCase);
}

export function listQueue(sessionContext, filters = {}) {
  const items = listCaseSummaries(sessionContext).filter((item) => filterQueueItem(item, filters, sessionContext.operator));
  const metrics = {
    total: items.length,
    unassigned: items.filter((item) => !item.assignedReviewerId).length,
    highPriority: items.filter((item) => item.workflowPriority === "high").length,
    professionalReviewRequired: items.filter((item) => item.workflowState === "professional-review-required").length,
    pendingDocuments: items.filter((item) => item.workflowState === "pending-documents").length
  };

  return { items, metrics };
}
