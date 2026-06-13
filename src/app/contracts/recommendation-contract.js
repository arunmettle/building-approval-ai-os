export const recommendationContract = {
  requiredFields: [
    "jurisdiction",
    "effectiveDate",
    "projectType",
    "pathwayLabel",
    "riskRating",
    "riskReasons",
    "requiredDocuments",
    "unknowns",
    "professionalReviewRecommended",
    "reviewerWorkflow",
    "citations",
    "narrative",
    "explanation",
    "narrativeValidation"
  ],
  allowedRiskRatings: ["low", "medium", "high", "unknown"],
  wordingRules: {
    allowed: [
      "Likely approval pathway",
      "Evidence-supported risk rating",
      "Potential compliance issues",
      "Documents likely required",
      "Professional review recommended"
    ],
    forbidden: [
      "Approved",
      "Legally compliant",
      "Guaranteed approval"
    ]
  }
};
