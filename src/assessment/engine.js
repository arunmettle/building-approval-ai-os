import fs from "node:fs";
import path from "node:path";
import { evaluateRule } from "./evaluator.js";
import { initialIntakeSchema } from "../app/contracts/intake-schema.js";

function readThresholdRules() {
  const rulesPath = path.resolve(process.cwd(), "data", "extraction", "threshold-rules.json");

  if (!fs.existsSync(rulesPath)) {
    throw new Error("No extracted threshold rules found. Run `npm run extract:sources` first.");
  }

  return JSON.parse(fs.readFileSync(rulesPath, "utf8"));
}

function collectUnknowns(intake) {
  return initialIntakeSchema.unknownTriggersProfessionalReview.filter((field) => {
    if (!(field in intake)) {
      return true;
    }

    const value = intake[field];
    return value === null || typeof value === "undefined";
  });
}

function derivePathway(matches) {
  if (matches.some((match) => match.outcome.includes("approval-required"))) {
    return "Likely approval pathway: building approval or certifier pathway required";
  }

  if (matches.some((match) => match.outcome.includes("no-building"))) {
    return "Likely approval pathway: candidate low-friction pathway, still subject to planning and siting checks";
  }

  return "Likely approval pathway: insufficient evidence, further review required";
}

function deriveRisk(matches, unknowns) {
  if (unknowns.length > 0) {
    return "unknown";
  }

  if (matches.some((match) => match.outcome.includes("approval-required"))) {
    return "high";
  }

  if (matches.length > 0) {
    return "medium";
  }

  return "unknown";
}

export function assessProject(intake) {
  const thresholdRules = readThresholdRules().filter((rule) => {
    if (rule.projectType !== intake.projectType) {
      return false;
    }

    if (!intake.jurisdictionId) {
      return true;
    }

    return rule.jurisdictionId === intake.jurisdictionId;
  });
  const evaluatedRules = thresholdRules.map((rule) => evaluateRule(rule, intake));
  const matchedRules = evaluatedRules.filter((rule) => rule.matched);
  const unknowns = [...new Set([...collectUnknowns(intake), ...evaluatedRules.flatMap((rule) => rule.unknownFields)])];

  return {
    projectType: intake.projectType,
    jurisdictionId: intake.jurisdictionId || null,
    pathwayLabel: derivePathway(matchedRules),
    riskRating: deriveRisk(matchedRules, unknowns),
    professionalReviewRecommended: unknowns.length > 0 || matchedRules.some((rule) => rule.outcome.includes("approval-required")),
    matchedRules,
    unknowns,
    requiredDocuments: ["site plan", "dimensioned drawing", "site photos"]
  };
}
