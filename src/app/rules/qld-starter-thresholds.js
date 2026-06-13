export const qldStarterThresholdRules = [
  {
    ruleId: "brisbane-deck-small-accepted-development-candidate",
    jurisdictionId: "au-qld-brisbane",
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
    status: "candidate",
    sourceUrl: "https://www.brisbane.qld.gov.au/building-and-planning/getting-started-on-your-project/residential-projects/deck"
  },
  {
    ruleId: "brisbane-shed-small-accepted-development-candidate",
    jurisdictionId: "au-qld-brisbane",
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
    status: "candidate",
    sourceUrl: "https://www.brisbane.qld.gov.au/building-and-planning/getting-started-on-your-project/residential-projects/shed"
  },
  {
    ruleId: "sunshine-coast-open-structure-building-approval-trigger-candidate",
    jurisdictionId: "au-qld-sunshine-coast",
    projectType: "pergola",
    outcome: "likely-building-work-approval-required",
    conditions: [
      "planAreaSqm > 10 || meanHeightM > 2.1 || maxHeightM > 2.4 || longestSideM > 5"
    ],
    status: "candidate",
    sourceUrl: "https://www.sunshinecoast.qld.gov.au/development/building/what-needs-building-approval"
  },
  {
    ruleId: "sunshine-coast-shed-small-accepted-development-candidate",
    jurisdictionId: "au-qld-sunshine-coast",
    projectType: "shed",
    outcome: "likely-no-building-work-approval",
    conditions: [
      "planAreaSqm <= 10",
      "longestSideM <= 5",
      "maxHeightM <= 2.4",
      "meanHeightM <= 2.1",
      "easementStatus == 'no'",
      "locatedOverInfrastructure == false",
      "nearRetainingWall == false"
    ],
    status: "candidate",
    sourceUrl: "https://www.sunshinecoast.qld.gov.au/development/building/sheds"
  }
];
