import path from "node:path";
import { assessProject } from "../assessment/engine.js";
import { buildRecommendation } from "../reporting/recommendation.js";
import { buildMarkdownReport } from "../reporting/markdown.js";
import { nextCaseId, getCaseById, listCases, saveCase } from "./repository.js";
import fs from "node:fs";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function summarizeCase(caseRecord) {
  return {
    caseId: caseRecord.caseId,
    createdAt: caseRecord.createdAt,
    updatedAt: caseRecord.updatedAt,
    projectType: caseRecord.projectType,
    jurisdictionId: caseRecord.jurisdictionId,
    address: caseRecord.address,
    pathwayLabel: caseRecord.pathwayLabel,
    riskRating: caseRecord.riskRating,
    workflowState: caseRecord.reviewerWorkflow.state,
    workflowPriority: caseRecord.reviewerWorkflow.priority,
    assignedReviewer: caseRecord.assignedReviewer || null
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

function buildCaseRecord({ caseId, input, assessment, recommendation, priorCase }) {
  const now = new Date().toISOString();
  const artifact = writeCaseArtifacts(caseId, assessment.input || input, assessment, recommendation);

  return {
    caseId,
    createdAt: priorCase?.createdAt || now,
    updatedAt: now,
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
    reviewerNotes: priorCase?.reviewerNotes || [],
    latestArtifact: artifact
  };
}

export function createCaseFromInput(input) {
  const caseId = nextCaseId();
  const assessment = assessProject(input);
  const effectiveInput = assessment.input || input;
  const recommendation = buildRecommendation(effectiveInput, assessment);
  const caseRecord = buildCaseRecord({
    caseId,
    input,
    assessment,
    recommendation,
    priorCase: null
  });

  saveCase(caseRecord);
  return caseRecord;
}

export function reassessCase(caseId) {
  const existing = getCaseById(caseId);

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
    priorCase: existing
  });

  saveCase(updated);
  return updated;
}

export function updateReviewerState(caseId, payload) {
  const existing = getCaseById(caseId);

  if (!existing) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const now = new Date().toISOString();
  const reviewerNotes = [...(existing.reviewerNotes || [])];

  if (payload.note) {
    reviewerNotes.push({
      createdAt: now,
      author: payload.author || payload.assignedReviewer || "reviewer",
      note: payload.note
    });
  }

  const updated = {
    ...existing,
    updatedAt: now,
    assignedReviewer: payload.assignedReviewer ?? existing.assignedReviewer ?? null,
    reviewerWorkflow: {
      ...existing.reviewerWorkflow,
      state: payload.state || existing.reviewerWorkflow.state,
      priority: payload.priority || existing.reviewerWorkflow.priority,
      blockingItems: payload.blockingItems || existing.reviewerWorkflow.blockingItems,
      requiredActions: payload.requiredActions || existing.reviewerWorkflow.requiredActions,
      escalationReasons: payload.escalationReasons || existing.reviewerWorkflow.escalationReasons
    },
    reviewerNotes
  };

  saveCase(updated);
  return updated;
}

export function getCaseDetail(caseId) {
  return getCaseById(caseId);
}

export function listCaseSummaries() {
  return listCases().map(summarizeCase);
}
