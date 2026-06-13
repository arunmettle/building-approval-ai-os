export const strategicContext = {
  product: "Building Approval AI OS",
  wedge: {
    geography: "Queensland, Australia",
    users: ["Installers", "Certifier-support teams"],
    permitTypes: ["Deck", "Pergola", "Shed", "Patio"],
    pilotCouncils: ["Brisbane City Council", "City of Moreton Bay", "Sunshine Coast Council"]
  },
  principles: [
    "Evidence over confidence",
    "Deterministic before generative",
    "Jurisdiction-first design",
    "Temporal validity",
    "Human-in-the-loop"
  ]
};

export const researchTracks = [
  {
    id: "market-installer-pain",
    category: "market",
    question: "Do installers have urgent pain around pre-checks and submission-readiness?",
    evidenceNeeded: [
      "Interview notes with installers",
      "Observed quote-to-submission workflow",
      "Current rejection or rework rates"
    ],
    nextActions: [
      "Recruit 10 installer interviews",
      "Map current workflow steps and delays",
      "Capture willingness-to-pay signals"
    ],
    priority: "high"
  },
  {
    id: "jurisdiction-source-selection",
    category: "regulatory",
    question: "How should the selected pilot councils be profiled and operationalized for ingestion?",
    evidenceNeeded: [
      "Confirmed source catalog for each selected council",
      "Property lookup and mapping pathways",
      "Historical approvals or search access"
    ],
    nextActions: [
      "Create jurisdiction profiles for Brisbane, Moreton Bay, and Sunshine Coast",
      "Separate state baseline sources from council-specific sources",
      "Prioritize first ingestion adapters by source type"
    ],
    priority: "high"
  },
  {
    id: "qld-state-baseline",
    category: "regulatory",
    question: "What Queensland state-level rules and forms should be modeled once for reuse across councils?",
    evidenceNeeded: [
      "Accepted development guidance",
      "DA forms and related guidance",
      "DA Rules and referral process guidance"
    ],
    nextActions: [
      "Model state baseline source catalog",
      "Extract reusable checklist and intake concepts",
      "Define council delta handling"
    ],
    priority: "high"
  },
  {
    id: "permit-threshold-model",
    category: "product",
    question: "Which deterministic inputs cover most decisions for decks, pergolas, sheds, and patios?",
    evidenceNeeded: [
      "Authority checklists",
      "Permit guides",
      "Professional review criteria"
    ],
    nextActions: [
      "Define canonical intake fields",
      "Map first-pass threshold checks",
      "Separate deterministic rules from unknowns"
    ],
    priority: "high"
  },
  {
    id: "evidence-contract",
    category: "technical",
    question: "What minimum evidence record is required for defensible recommendations?",
    evidenceNeeded: [
      "Citation fields from blueprint",
      "Audit requirements",
      "Reviewer usability needs"
    ],
    nextActions: [
      "Lock evidence schema",
      "Define claim-to-citation validation rules",
      "Design report evidence table"
    ],
    priority: "medium"
  }
];
