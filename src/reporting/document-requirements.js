import fs from "node:fs";
import path from "node:path";

function readChecklistItems() {
  const checklistPath = path.resolve(process.cwd(), "data", "extraction", "checklist-items.json");

  if (!fs.existsSync(checklistPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(checklistPath, "utf8"));
}

function normalizeDocumentLabel(label) {
  return label.trim().toLowerCase();
}

const pathwaySensitiveDocuments = new Set([
  "da form 1",
  "da form 2",
  "building work details",
  "referral checklist for building work",
  "relevant plans",
  "owner's consent",
  "planning report"
]);

function requiresFormalApplicationPath(assessment) {
  if (assessment.professionalReviewRecommended) {
    return true;
  }

  return assessment.matchedRules.some((rule) => {
    const outcome = (rule.outcome || "").toLowerCase();
    return (
      outcome.includes("approval-required") ||
      outcome.includes("building-approval-required") ||
      outcome.includes("building-work-approval-required") ||
      outcome.includes("council-pathway")
    );
  });
}

export function resolveRequiredDocuments(input, assessment) {
  const baseDocuments = assessment.requiredDocuments || [];
  const checklistItems = readChecklistItems();
  const jurisdictionId = assessment.jurisdictionId;
  const projectType = assessment.projectType;

  const extractedDocuments = checklistItems
    .filter((item) => {
      if (jurisdictionId && item.jurisdictionId !== jurisdictionId && item.jurisdictionId !== "qld-state-baseline") {
        return false;
      }

      if (!item.projectTypes || item.projectTypes.length === 0) {
        return true;
      }

      return item.projectTypes.includes(projectType);
    })
    .flatMap((item) => item.documentHints || []);

  const documentSet = new Map();

  for (const label of [...baseDocuments, ...extractedDocuments]) {
    const normalized = normalizeDocumentLabel(label);

    if (!documentSet.has(normalized)) {
      documentSet.set(normalized, label);
    }
  }

  if (input.engineeringDocsAvailable === false) {
    documentSet.set("engineering documentation", "engineering documentation");
  }

  const formalApplicationPath = requiresFormalApplicationPath(assessment);

  return [...documentSet.entries()]
    .filter(([normalized]) => {
      if (!pathwaySensitiveDocuments.has(normalized)) {
        return true;
      }

      return formalApplicationPath;
    })
    .map(([, label]) => label);
}
