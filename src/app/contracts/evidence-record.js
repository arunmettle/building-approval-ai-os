export const evidenceRecordContract = {
  requiredFields: [
    "sourceId",
    "sourceName",
    "sourceType",
    "sourceUrl",
    "jurisdictionId",
    "effectiveDate",
    "retrievedAt",
    "sectionRef",
    "pageRef",
    "snippet",
    "normalizedClaim",
    "confidence",
    "lineage"
  ],
  sourceTypes: [
    "planning-scheme",
    "building-code",
    "council-form",
    "council-fact-sheet",
    "gis-layer",
    "historical-decision",
    "user-document"
  ],
  lineageFields: [
    "rawObjectPath",
    "snapshotHash",
    "extractorVersion",
    "reviewStatus"
  ]
};
