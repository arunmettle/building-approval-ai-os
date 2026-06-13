import fs from "node:fs";
import path from "node:path";
import { evaluateRule } from "./evaluator.js";
import { initialIntakeSchema } from "../app/contracts/intake-schema.js";
import { enrichIntakeWithPropertyProfile, hasOverlayReviewTrigger } from "../property/lookup.js";

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

function derivePathway(matches, propertyProfile) {
  if (hasOverlayReviewTrigger(propertyProfile)) {
    return "Likely approval pathway: overlay-sensitive pathway, council or certifier review likely";
  }

  if (matches.some((match) => match.outcome.includes("approval-required"))) {
    return "Likely approval pathway: building approval or certifier pathway required";
  }

  if (matches.some((match) => match.outcome.includes("no-building"))) {
    return "Likely approval pathway: candidate low-friction pathway, still subject to planning and siting checks";
  }

  return "Likely approval pathway: insufficient evidence, further review required";
}

function deriveRisk(matches, unknowns, propertyProfile) {
  if (unknowns.length > 0) {
    return "unknown";
  }

  if (hasOverlayReviewTrigger(propertyProfile)) {
    return "high";
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
  const { intake: enrichedIntake, propertyProfile } = enrichIntakeWithPropertyProfile(intake);
  const thresholdRules = readThresholdRules().filter((rule) => {
    if (rule.projectType !== enrichedIntake.projectType) {
      return false;
    }

    if (!enrichedIntake.jurisdictionId) {
      return true;
    }

    return rule.jurisdictionId === enrichedIntake.jurisdictionId;
  });
  const evaluatedRules = thresholdRules.map((rule) => evaluateRule(rule, enrichedIntake));
  const matchedRules = evaluatedRules.filter((rule) => rule.matched);
  const unknowns = [...new Set([...collectUnknowns(enrichedIntake), ...evaluatedRules.flatMap((rule) => rule.unknownFields)])];
  const overlayReviewRequired = hasOverlayReviewTrigger(propertyProfile);

  return {
    input: enrichedIntake,
    propertyProfile,
    projectType: enrichedIntake.projectType,
    jurisdictionId: enrichedIntake.jurisdictionId || null,
    pathwayLabel: derivePathway(matchedRules, propertyProfile),
    riskRating: deriveRisk(matchedRules, unknowns, propertyProfile),
    professionalReviewRecommended:
      overlayReviewRequired ||
      unknowns.length > 0 ||
      matchedRules.some((rule) => rule.outcome.includes("approval-required")),
    matchedRules,
    unknowns,
    requiredDocuments: ["site plan", "dimensioned drawing", "site photos"]
  };
}
