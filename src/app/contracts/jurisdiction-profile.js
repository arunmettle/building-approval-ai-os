export const jurisdictionProfileContract = {
  requiredFields: [
    "jurisdictionId",
    "country",
    "stateOrProvince",
    "localAuthority",
    "planningAuthority",
    "buildingAuthority",
    "supportedPermitTypes",
    "sourceCatalog",
    "overlays",
    "effectiveDatePolicy"
  ],
  sourceCatalogEntryFields: [
    "sourceId",
    "label",
    "type",
    "url",
    "freshnessExpectationDays",
    "requiresManualReview"
  ]
};
