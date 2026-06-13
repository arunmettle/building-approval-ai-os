import { createEvidenceRecord, findBetween, normalizeWhitespace } from "./helpers.js";

function buildThresholdRule({
  source,
  ruleId,
  projectType,
  outcome,
  conditions,
  snippet,
  extractedAt,
  metadataPath
}) {
  return {
    ruleId,
    jurisdictionId: source.jurisdictionId,
    projectType,
    outcome,
    conditions,
    status: "candidate",
    sourceUrl: source.url,
    extractedAt: extractedAt.toISOString(),
    evidence: createEvidenceRecord({
      source,
      snippet,
      normalizedClaim: `${projectType}:${outcome}`,
      confidence: 0.92,
      claimType: "threshold-rule",
      extractedAt,
      metadataPath
    })
  };
}

function buildChecklistItem({
  source,
  itemId,
  label,
  snippet,
  projectTypes = [],
  documentHints = [],
  extractedAt,
  metadataPath
}) {
  return {
    itemId,
    jurisdictionId: source.jurisdictionId,
    label,
    projectTypes,
    documentHints,
    status: "candidate",
    sourceUrl: source.url,
    extractedAt: extractedAt.toISOString(),
    evidence: createEvidenceRecord({
      source,
      snippet,
      normalizedClaim: `checklist:${label}`,
      confidence: 0.8,
      claimType: "checklist-item",
      extractedAt,
      metadataPath
    })
  };
}

function extractBrisbaneDeck(source, text, extractedAt, metadataPath) {
  const section = findBetween(
    text,
    "Building approval You don’t need building approval for a deck if:",
    "If your project doesn’t meet all the requirements"
  ) || findBetween(text, "Building approval You donâ€™t need building approval for a deck if:", "If your project doesnâ€™t meet all the requirements");

  if (!section) {
    return null;
  }

  const snippet = normalizeWhitespace(section);

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "brisbane-deck-accepted-development-extracted",
        projectType: "deck",
        outcome: "likely-no-building-approval",
        conditions: [
          "planAreaSqm <= 10",
          "maxHeightAboveNaturalGroundM <= 1",
          "roofed == false",
          "longestSideM <= 5",
          "affectsExistingStructure == false",
          "nearPoolEnclosure == false"
        ],
        snippet,
        extractedAt,
        metadataPath
      })
    ],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "brisbane-deck-zone-overlay-check",
        label: "Confirm zones and overlays in City Plan Online",
        snippet: normalizeWhitespace(findBetween(text, "Before you start your deck project, you should:", "What types of approval do I need?") || ""),
        projectTypes: ["deck"],
        documentHints: ["property planning report"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractBrisbaneShed(source, text, extractedAt, metadataPath) {
  const approvalSection =
    findBetween(
      text,
      "Building approval According to the Building Regulation 2021 and the Queensland Development Code , you don’t need building approval if your shed:",
      "You'll need to ensure your work complies"
    ) ||
    findBetween(
      text,
      "Building approval According to the Building Regulation 2021 and the Queensland Development Code , you donâ€™t need building approval if your shed:",
      "You'll need to ensure your work complies"
    );

  const planningSection =
    findBetween(text, "Planning approval Sheds are generally accepted development", "Building approval") ||
    findBetween(text, "Planning approval Sheds are generally accepted development", "Note");

  if (!approvalSection) {
    return null;
  }

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "brisbane-shed-accepted-development-extracted",
        projectType: "shed",
        outcome: "likely-no-building-approval",
        conditions: [
          "planAreaSqm <= 10",
          "maxHeightM <= 2.4",
          "meanHeightM <= 2.1",
          "longestSideM <= 5",
          "affectsExistingStructure == false",
          "nearPoolEnclosure == false"
        ],
        snippet: normalizeWhitespace(approvalSection),
        extractedAt,
        metadataPath
      })
    ],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "brisbane-shed-residential-zone-check",
        label: "Confirm residential zone and overlay or neighbourhood plan status",
        snippet: normalizeWhitespace(planningSection || approvalSection),
        projectTypes: ["shed"],
        documentHints: ["property planning report"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractSunshineWhatNeeds(source, text, extractedAt, metadataPath) {
  const garagesSection =
    findBetween(
      text,
      "Garages, carports, sheds A development building work permit is required for:",
      "Decks, pergolas, verandahs, patios, balconies and temporary structures"
    ) || findBetween(text, "Garages, carports, sheds Garages, carports, sheds A development building work permit is required for:", "Decks, pergolas, verandahs, patios, balconies and temporary structures");

  const decksSection =
    findBetween(
      text,
      "Decks, pergolas, verandahs, patios, balconies and temporary structures A development building work permit is required for:",
      "Fences and retaining walls"
    ) ||
    findBetween(
      text,
      "Decks, pergolas, verandahs, patios, balconies and temporary structures Decks, pergolas, verandahs, patios, balconies and temporary structures A development building work permit is required for:",
      "Fences and retaining walls"
    );

  if (!garagesSection && !decksSection) {
    return null;
  }

  const thresholdRules = [];

  if (garagesSection) {
    thresholdRules.push(
      buildThresholdRule({
        source,
        ruleId: "sunshine-coast-shed-building-approval-trigger-extracted",
        projectType: "shed",
        outcome: "likely-building-work-approval-required",
        conditions: ["planAreaSqm > 10 || maxHeightM > 2.4"],
        snippet: normalizeWhitespace(garagesSection),
        extractedAt,
        metadataPath
      })
    );
  }

  if (decksSection) {
    thresholdRules.push(
      buildThresholdRule({
        source,
        ruleId: "sunshine-coast-open-structure-building-approval-trigger-extracted",
        projectType: "patio",
        outcome: "likely-building-work-approval-required",
        conditions: [
          "planAreaSqm > 10 || meanHeightM > 2.1 || maxHeightM > 2.4 || longestSideM > 5 || heightAboveSurfaceLevelM >= 1"
        ],
        snippet: normalizeWhitespace(decksSection),
        extractedAt,
        metadataPath
      })
    );
  }

  return {
    evidenceRecords: [],
    thresholdRules,
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "sunshine-coast-certifier-advice",
        label: "Seek private building certifier advice before commencing project",
        snippet: normalizeWhitespace(findBetween(text, "What needs building approval", "All buildings and structures") || ""),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["private certifier advice"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractSunshineSheds(source, text, extractedAt, metadataPath) {
  const acceptedSection =
    findBetween(
      text,
      "You will not need a building work approval if your shed meets all below requirements:",
      "If the shed does not comply with ALL of the above requirements"
    ) ||
    findBetween(
      text,
      "Building work approval In limited circumstances, you can build class 10a non-habitable buildings without a building work approval.",
      "If the shed does not comply with ALL of the above requirements"
    );

  const locationSection = findBetween(text, "Location In a residential zone, your shed must be setback:", "Sheds that do not meet the siting requirements");

  if (!acceptedSection) {
    return null;
  }

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "sunshine-coast-shed-accepted-development-extracted",
        projectType: "shed",
        outcome: "likely-no-building-work-approval",
        conditions: [
          "planAreaSqm <= 10",
          "longestSideM <= 5",
          "maxHeightM <= 2.4",
          "meanHeightM <= 2.1",
          "boundarySetbacksCompliant == true",
          "easementStatus == 'no'",
          "locatedOverInfrastructure == false",
          "nearRetainingWall == false"
        ],
        snippet: normalizeWhitespace(acceptedSection),
        extractedAt,
        metadataPath
      })
    ],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "sunshine-coast-shed-overlay-check",
        label: "Check Development.i site report for overlays affecting shed construction",
        snippet: normalizeWhitespace(findBetween(text, "Overlays Check your address on Development.i Site Report", "Height and floor area") || locationSection || acceptedSection),
        projectTypes: ["shed"],
        documentHints: ["site report"],
        extractedAt,
        metadataPath
      }),
      buildChecklistItem({
        source,
        itemId: "sunshine-coast-shed-boundary-setback-check",
        label: "Confirm road frontage and side or rear boundary setbacks",
        snippet: normalizeWhitespace(locationSection || acceptedSection),
        projectTypes: ["shed"],
        documentHints: ["site plan"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractMoretonBayBuildingPermits(source, text, extractedAt, metadataPath) {
  const permitSection =
    findBetween(
      text,
      "Which buildings and structures need approval Buildings and structures that need approval include:",
      "A private building certifier can tell you if you need building approval."
    ) ||
    findBetween(
      text,
      "Building permits, approvals and final certificates Talk to a private certifier before you build.",
      "Building approval versus finalisation"
    );

  const introSection = findBetween(
    text,
    "Before you start construction, you may need a permit.",
    "After construction, the certifier will inspect"
  );

  if (!permitSection && !introSection) {
    return null;
  }

  const checklistItems = [];

  if (introSection) {
    checklistItems.push(
      buildChecklistItem({
        source,
        itemId: "moreton-bay-certifier-siting-check",
        label: "Check boundary setbacks, site coverage, sewers, stormwater and easements with a private certifier",
        snippet: normalizeWhitespace(introSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["site plan", "easement and services information"],
        extractedAt,
        metadataPath
      })
    );
  }

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "moreton-bay-shed-building-approval-trigger-extracted",
        projectType: "shed",
        outcome: "likely-building-approval-required",
        conditions: ["planAreaSqm > 10 || maxHeightM > 2.4"],
        snippet: normalizeWhitespace(permitSection || introSection),
        extractedAt,
        metadataPath
      })
    ],
    checklistItems
  };
}

function extractMoretonBayDomesticOutbuildings(source, text, extractedAt, metadataPath) {
  const acceptedSection = findBetween(
    text,
    "Do I need Council approval?",
    "Development approval will be required from Council if the Domestic outbuilding is located in the following zones, overlay maps or areas:"
  );
  const generalResidentialSection = findBetween(
    text,
    "General Residential and Emerging Community zone requirements",
    "Rural Residential, Rural, Emerging community and Township zone requirements"
  );
  const overlaySection = findBetween(
    text,
    "Overlay maps requirements",
    "What if there is no dwelling house on the property?"
  );

  if (!acceptedSection && !generalResidentialSection) {
    return null;
  }

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "moreton-bay-domestic-outbuilding-accepted-development-candidate",
        projectType: "shed",
        outcome: "likely-low-friction-council-pathway",
        conditions: ["planAreaSqm <= 50"],
        snippet: normalizeWhitespace(acceptedSection || generalResidentialSection),
        extractedAt,
        metadataPath
      })
    ],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "moreton-bay-domestic-outbuilding-overlay-check",
        label: "Check zone, precinct and overlay map requirements before relying on accepted development",
        snippet: normalizeWhitespace(overlaySection || acceptedSection || generalResidentialSection),
        projectTypes: ["shed"],
        documentHints: ["property planning report", "site plan"],
        extractedAt,
        metadataPath
      }),
      buildChecklistItem({
        source,
        itemId: "moreton-bay-domestic-outbuilding-lot-size-check",
        label: "Confirm lot size because roofed area limits vary by lot area",
        snippet: normalizeWhitespace(generalResidentialSection || acceptedSection),
        projectTypes: ["shed"],
        documentHints: ["site plan"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractQldAcceptedDevelopment(source, text, extractedAt, metadataPath) {
  const acceptedSection = findBetween(
    text,
    "Accepted development (self assessable) – Schedule 1",
    "Other accepted development (exempt from relevant provisions)"
  ) || findBetween(
    text,
    "Accepted development (self assessable) &ndash; Schedule 1",
    "Other accepted development (exempt from relevant provisions)"
  );

  if (!acceptedSection) {
    return null;
  }

  return {
    evidenceRecords: [],
    thresholdRules: [
      buildThresholdRule({
        source,
        ruleId: "qld-small-tool-shed-accepted-development-baseline",
        projectType: "shed",
        outcome: "state-baseline-accepted-development-reference",
        conditions: ["planAreaSqm <= 10"],
        snippet: normalizeWhitespace(acceptedSection),
        extractedAt,
        metadataPath
      })
    ],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "qld-accepted-development-planning-scheme-check",
        label: "Check local planning scheme even when building work is accepted development",
        snippet: normalizeWhitespace(acceptedSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["property planning report"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

function extractQldDaForms(source, text, extractedAt, metadataPath) {
  const formsSection = findBetween(
    text,
    "Development application and change application forms",
    "Guides to using development application forms"
  );
  const templatesSection = findBetween(
    text,
    "Guides to using development application forms",
    "Decision notices and deemed approval notice"
  );

  if (!formsSection && !templatesSection) {
    return null;
  }

  return {
    evidenceRecords: [],
    thresholdRules: [],
    checklistItems: [
      buildChecklistItem({
        source,
        itemId: "qld-da-form-1",
        label: "Use DA Form 1 for development application details",
        snippet: normalizeWhitespace(formsSection || templatesSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["DA Form 1"],
        extractedAt,
        metadataPath
      }),
      buildChecklistItem({
        source,
        itemId: "qld-da-form-2",
        label: "Use DA Form 2 for building work details",
        snippet: normalizeWhitespace(formsSection || templatesSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["DA Form 2", "building work details"],
        extractedAt,
        metadataPath
      }),
      buildChecklistItem({
        source,
        itemId: "qld-building-referral-checklist",
        label: "Include the referral checklist for building work where applicable",
        snippet: normalizeWhitespace(formsSection || templatesSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["referral checklist for building work"],
        extractedAt,
        metadataPath
      }),
      buildChecklistItem({
        source,
        itemId: "qld-relevant-plans-and-owner-consent",
        label: "Prepare relevant plans and owner consent materials before lodgement",
        snippet: normalizeWhitespace(templatesSection || formsSection),
        projectTypes: ["deck", "pergola", "shed", "patio"],
        documentHints: ["relevant plans", "owner's consent", "planning report"],
        extractedAt,
        metadataPath
      })
    ]
  };
}

const extractorMap = {
  "qld-business-accepted-development": extractQldAcceptedDevelopment,
  "qld-planning-da-forms": extractQldDaForms,
  "brisbane-deck-guidance": extractBrisbaneDeck,
  "brisbane-shed-guidance": extractBrisbaneShed,
  "moreton-bay-building-permits": extractMoretonBayBuildingPermits,
  "moreton-bay-domestic-outbuildings": extractMoretonBayDomesticOutbuildings,
  "sunshine-coast-what-needs-building-approval": extractSunshineWhatNeeds,
  "sunshine-coast-sheds": extractSunshineSheds
};

export function extractFromSource(source, text, extractedAt, metadataPath) {
  const extractor = extractorMap[source.sourceId];

  if (!extractor) {
    return {
      supported: false,
      evidenceRecords: [],
      thresholdRules: [],
      checklistItems: [],
      notes: ["No source-specific extractor configured yet."]
    };
  }

  const result = extractor(source, text, extractedAt, metadataPath);

  if (!result) {
    return {
      supported: true,
      evidenceRecords: [],
      thresholdRules: [],
      checklistItems: [],
      notes: ["Extractor configured but no matching section was found in snapshot text."]
    };
  }

  return {
    supported: true,
    notes: [],
    ...result
  };
}
