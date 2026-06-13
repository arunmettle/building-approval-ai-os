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

  return [...documentSet.values()];
}
