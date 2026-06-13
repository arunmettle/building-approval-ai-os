export const propertyProfileContract = {
  requiredFields: [
    "propertyProfileId",
    "jurisdictionId",
    "lookupKey",
    "address",
    "zone",
    "overlays",
    "sources"
  ],
  overlayReviewTriggers: [
    "flood",
    "heritage",
    "bushfire",
    "coastal",
    "character",
    "environmental",
    "local-plan",
    "neighbourhood-plan"
  ]
};
