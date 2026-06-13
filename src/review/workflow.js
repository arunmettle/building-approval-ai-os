const documentAvailabilityMap = {
  "site plan": "sitePlanAvailable",
  "dimensioned drawing": "dimensionedDrawingAvailable",
  "site photos": "sitePhotosAvailable",
  "engineering documentation": "engineeringDocsAvailable",
  "owner's consent": "ownerConsentAvailable",
  "existing approvals": "existingApprovalsAvailable"
};

function normalizeLabel(label) {
  return String(label || "").trim().toLowerCase();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function detectMissingDocuments(input, requiredDocuments) {
  return requiredDocuments.filter((documentLabel) => {
    const availabilityField = documentAvailabilityMap[normalizeLabel(documentLabel)];

    if (!availabilityField) {
      return false;
    }

    return input[availabilityField] === false;
  });
}

function derivePriority({ professionalReviewRecommended, riskRating, missingDocuments, unknowns }) {
  if (professionalReviewRecommended || riskRating === "high") {
    return "high";
  }

  if (missingDocuments.length > 0 || unknowns.length > 0 || riskRating === "unknown") {
    return "medium";
  }

  return "low";
}

function deriveState({ professionalReviewRecommended, propertyProfile, missingDocuments, unknowns, riskRating }) {
  if (unknowns.length > 0) {
    return "needs-intake-clarification";
  }

  if (missingDocuments.length > 0) {
    return "pending-documents";
  }

  if (professionalReviewRecommended || propertyProfile?.overlays?.length || riskRating === "high") {
    return "professional-review-required";
  }

  return "ready-for-submission-pack";
}

function deriveBlockingItems({ unknowns, missingDocuments, propertyProfile, professionalReviewRecommended }) {
  const items = [];

  if (unknowns.length > 0) {
    items.push(`Clarify intake fields: ${unknowns.join(", ")}`);
  }

  if (missingDocuments.length > 0) {
    items.push(`Prepare missing documents: ${missingDocuments.join(", ")}`);
  }

  if (professionalReviewRecommended) {
    items.push("Route to a private certifier or reviewer before relying on the pathway.");
  }

  if (propertyProfile?.overlays?.length) {
    items.push(`Review overlay impacts: ${propertyProfile.overlays.join(", ")}`);
  }

  return unique(items);
}

function deriveActions({ state, propertyProfile, missingDocuments, unknowns, professionalReviewRecommended }) {
  const actions = [];

  if (state === "needs-intake-clarification") {
    actions.push("Collect the missing intake fields before finalizing the pathway.");
  }

  if (propertyProfile?.sources?.length) {
    actions.push("Check the mapped property sources for parcel-specific zone and overlay context.");
  }

  if (propertyProfile?.overlays?.length) {
    actions.push("Confirm whether overlay-specific reports, siting checks, or council applications are triggered.");
  }

  if (missingDocuments.length > 0) {
    actions.push(`Prepare and attach: ${missingDocuments.join(", ")}.`);
  }

  if (professionalReviewRecommended) {
    actions.push("Escalate the case to professional review with the evidence pack and parcel context.");
  }

  if (state === "ready-for-submission-pack") {
    actions.push("Generate the submission pack and proceed to lodgement preparation.");
  }

  if (unknowns.length === 0 && missingDocuments.length === 0 && !professionalReviewRecommended) {
    actions.push("Proceed with submission-readiness checks.");
  }

  return unique(actions);
}

function deriveEscalationReasons({ riskRating, professionalReviewRecommended, propertyProfile, matchedRules }) {
  const reasons = [];

  if (riskRating === "high") {
    reasons.push("The assessment risk is high.");
  }

  if (professionalReviewRecommended) {
    reasons.push("Professional review was recommended by the assessment logic.");
  }

  if (propertyProfile?.overlays?.length) {
    reasons.push(`Parcel overlays are present: ${propertyProfile.overlays.join(", ")}.`);
  }

  if (matchedRules.some((rule) => rule.outcome.includes("approval-required"))) {
    reasons.push("A matched rule indicates an approval or certifier pathway is likely required.");
  }

  return unique(reasons);
}

export function buildReviewerWorkflow(input, assessment, requiredDocuments) {
  const missingDocuments = detectMissingDocuments(input, requiredDocuments);
  const unknowns = assessment.unknowns || [];
  const propertyProfile = assessment.propertyProfile || null;
  const professionalReviewRecommended = Boolean(assessment.professionalReviewRecommended);
  const riskRating = assessment.riskRating || "unknown";
  const state = deriveState({
    professionalReviewRecommended,
    propertyProfile,
    missingDocuments,
    unknowns,
    riskRating
  });
  const priority = derivePriority({
    professionalReviewRecommended,
    riskRating,
    missingDocuments,
    unknowns
  });

  return {
    state,
    priority,
    blockingItems: deriveBlockingItems({
      unknowns,
      missingDocuments,
      propertyProfile,
      professionalReviewRecommended
    }),
    requiredActions: deriveActions({
      state,
      propertyProfile,
      missingDocuments,
      unknowns,
      professionalReviewRecommended
    }),
    escalationReasons: deriveEscalationReasons({
      riskRating,
      professionalReviewRecommended,
      propertyProfile,
      matchedRules: assessment.matchedRules || []
    }),
    parcelContextResolved: Boolean(propertyProfile),
    missingDocuments
  };
}
