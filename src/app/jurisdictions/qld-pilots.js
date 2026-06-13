export const queenslandStateBaseline = {
  jurisdictionId: "qld-state-baseline",
  country: "Australia",
  stateOrProvince: "Queensland",
  scope: "state",
  label: "Queensland state baseline",
  sourceCatalog: [
    {
      sourceId: "qld-business-accepted-development",
      label: "When you don't need building approval",
      type: "state-guidance",
      url: "https://www.business.qld.gov.au/industries/building-property-development/building-construction/approvals-inspections/when-not-needed",
      freshnessExpectationDays: 90,
      requiresManualReview: true
    },
    {
      sourceId: "qld-planning-da-forms",
      label: "Development application forms and templates",
      type: "state-forms-guidance",
      url: "https://www.planning.qld.gov.au/planning-framework/development-assessment/development-assessment-process/forms-and-templates",
      freshnessExpectationDays: 90,
      requiresManualReview: true
    },
    {
      sourceId: "qld-planning-da-rules",
      label: "Development Assessment Rules",
      type: "state-process-guidance",
      url: "https://www.planning.qld.gov.au/planning-framework/development-assessment/development-assessment-process/da-rules",
      freshnessExpectationDays: 90,
      requiresManualReview: true
    }
  ]
};

export const queenslandPilotJurisdictions = [
  {
    jurisdictionId: "au-qld-brisbane",
    country: "Australia",
    stateOrProvince: "Queensland",
    localAuthority: "Brisbane City Council",
    planningAuthority: "Brisbane City Council",
    buildingAuthority: "Private certifier with council planning interfaces",
    supportedPermitTypes: ["deck", "pergola", "shed", "patio"],
    sourceCatalog: [
      {
        sourceId: "brisbane-deck-guidance",
        label: "Decks and decking approvals",
        type: "council-guidance",
        url: "https://www.brisbane.qld.gov.au/building-and-planning/getting-started-on-your-project/residential-projects/deck",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "brisbane-shed-guidance",
        label: "Building a shed - approvals and requirements",
        type: "council-guidance",
        url: "https://www.brisbane.qld.gov.au/building-and-planning/getting-started-on-your-project/residential-projects/shed",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "brisbane-city-plan-online",
        label: "City Plan online",
        type: "planning-scheme-portal",
        url: "https://www.brisbane.qld.gov.au/building-and-planning/supporting-documents-and-online-tools/city-plan-online",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      },
      {
        sourceId: "brisbane-developmenti",
        label: "Development.i",
        type: "historical-approvals-portal",
        url: "https://developmenti.brisbane.qld.gov.au/",
        freshnessExpectationDays: 14,
        requiresManualReview: false
      },
      {
        sourceId: "brisbane-open-data-zoning",
        label: "City Plan 2014 zoning overlay",
        type: "open-data-dataset",
        url: "https://data.brisbane.qld.gov.au/explore/dataset/cp14-zoning-overlay/",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      }
    ],
    overlays: ["character", "flood", "neighbourhood-plan", "heritage", "bushfire-if-applicable"],
    effectiveDatePolicy: "Use City Plan effective version plus source retrieval timestamp."
  },
  {
    jurisdictionId: "au-qld-moreton-bay",
    country: "Australia",
    stateOrProvince: "Queensland",
    localAuthority: "City of Moreton Bay",
    planningAuthority: "City of Moreton Bay",
    buildingAuthority: "Private certifier with council planning interfaces",
    supportedPermitTypes: ["deck", "pergola", "shed", "patio"],
    sourceCatalog: [
      {
        sourceId: "moreton-bay-building-permits",
        label: "Building permits, approvals and final certificates",
        type: "council-guidance",
        url: "https://www.moretonbay.qld.gov.au/Services/Building-Development/Building/Building-Permits-And-Approval",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "moreton-bay-domestic-outbuildings",
        label: "Domestic outbuildings (sheds and carports)",
        type: "planning-scheme-info-sheet",
        url: "https://www.moretonbay.qld.gov.au/Services/Building-Development/Planning-Schemes/MBRC/Info-Sheets/Domestic-Outbuildings",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "moreton-bay-planning-scheme",
        label: "MBRC Planning Scheme",
        type: "planning-scheme-portal",
        url: "https://www.moretonbay.qld.gov.au/Services/Building-Development/Planning-Schemes/MBRC",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      },
      {
        sourceId: "moreton-bay-property-lookup",
        label: "My property look up",
        type: "property-lookup",
        url: "https://www.moretonbay.qld.gov.au/Services/Building-Development/Planning-Schemes/My-Property-Look-Up",
        freshnessExpectationDays: 14,
        requiresManualReview: false
      },
      {
        sourceId: "moreton-bay-datahub",
        label: "City of Moreton Bay DataHub",
        type: "open-data-portal",
        url: "https://datahub.moretonbay.qld.gov.au/",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      }
    ],
    overlays: ["flood", "bushfire", "environmental", "heritage-landscape-character", "building-envelope"],
    effectiveDatePolicy: "Use current planning scheme version plus source retrieval timestamp."
  },
  {
    jurisdictionId: "au-qld-sunshine-coast",
    country: "Australia",
    stateOrProvince: "Queensland",
    localAuthority: "Sunshine Coast Council",
    planningAuthority: "Sunshine Coast Council",
    buildingAuthority: "Private certifier with council planning interfaces",
    supportedPermitTypes: ["deck", "pergola", "shed", "patio"],
    sourceCatalog: [
      {
        sourceId: "sunshine-coast-what-needs-building-approval",
        label: "What needs building approval",
        type: "council-guidance",
        url: "https://www.sunshinecoast.qld.gov.au/development/building/what-needs-building-approval",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "sunshine-coast-sheds",
        label: "Sheds",
        type: "council-guidance",
        url: "https://www.sunshinecoast.qld.gov.au/development/building/sheds",
        freshnessExpectationDays: 60,
        requiresManualReview: true
      },
      {
        sourceId: "sunshine-coast-interactive-mapping",
        label: "Interactive mapping",
        type: "planning-mapping-portal",
        url: "https://www.sunshinecoast.qld.gov.au/development/planning-documents/sunshine-coast-planning-scheme-2014/interactive-mapping",
        freshnessExpectationDays: 14,
        requiresManualReview: false
      },
      {
        sourceId: "sunshine-coast-building-search",
        label: "Building searches",
        type: "historical-records-search",
        url: "https://www.sunshinecoast.qld.gov.au/development/searches/building-records-search",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      },
      {
        sourceId: "sunshine-coast-open-data",
        label: "Sunshine Coast Council Public Access Hub",
        type: "open-data-portal",
        url: "https://data.sunshinecoast.qld.gov.au/search?tags=qld",
        freshnessExpectationDays: 30,
        requiresManualReview: false
      }
    ],
    overlays: ["flood", "bushfire", "heritage", "coastal", "local-plan", "environmental"],
    effectiveDatePolicy: "Use planning scheme version and map context captured at retrieval time."
  }
];
