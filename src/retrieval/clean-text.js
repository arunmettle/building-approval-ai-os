const replacementRules = [
  [/&nbsp;/gi, " "],
  [/&amp;/gi, "&"],
  [/&rsquo;|&#39;|&apos;|&#0?39;/gi, "'"],
  [/&ldquo;|&rdquo;|&quot;/gi, "\""],
  [/&ndash;|&mdash;|&#8211;|&#8212;/gi, "-"],
  [/&hellip;/gi, "..."],
  [/&copy;|&#169;/gi, " "],
  [/&sup2;/gi, "2"],
  [/&gt;/gi, ">"],
  [/&lt;/gi, "<"],
  [/\\r\\n/gi, " "],
  [/\\n/gi, " "],
  [/\\t/gi, " "],
  [/â€˜|â€™|Ã¢â‚¬â„¢/gi, "'"],
  [/â€œ|â€\x9d|Ã¢â‚¬Å“|Ã¢â‚¬/gi, "\""],
  [/â€“|â€”|Ã¢â‚¬â€œ/gi, "-"],
  [/Ã‚/g, " "]
];

const boilerplateFragments = [
  "skip to main content",
  "back to top",
  "contact us",
  "privacy",
  "copyright",
  "accessibility",
  "follow us",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "sitemap",
  "language support",
  "report an issue",
  "request a service",
  "all other enquiries",
  "general contacts",
  "version:",
  "last updated",
  "pay and apply",
  "site help",
  "website support"
];

const chunkRemovalPatterns = [
  /"\}\}">/g,
  /"\}\}"/g,
  /id="[^"]*"/gi,
  /class="[^"]*"/gi,
  /\bA A A\b/g,
  /\bShare Link copied\b/gi,
  /\bShare\b/gi,
  /\bOn this page\b/gi,
  /\bIn this section\b/gi,
  /\bSkip to main content\b/gi,
  /\bBack to top\b/gi,
  /\bClose Home\b/gi,
  /\bSearch Menu Close\b/gi
];

function cutBeforeMarker(text, markers) {
  let cleaned = text;

  for (const marker of markers) {
    const index = cleaned.toLowerCase().indexOf(marker.toLowerCase());

    if (index !== -1) {
      cleaned = cleaned.slice(index + marker.length).trim();
    }
  }

  return cleaned;
}

function dedupeAdjacentSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [];
  const output = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();

    if (!normalized) {
      continue;
    }

    const previous = output[output.length - 1]?.trim().toLowerCase();

    if (normalized === previous) {
      continue;
    }

    output.push(sentence.trim());
  }

  return output.join(" ").replace(/\s+/g, " ").trim();
}

export function cleanRetrievedText(text) {
  let cleaned = text;

  for (const [pattern, replacement] of replacementRules) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

export function trimToRelevantStart(text, sourceId) {
  const sourceSpecificMarkers = {
    "qld-business-accepted-development": [
      "When you don't need building approval Under the Building Regulation 2021",
      "When you don't need building approval"
    ],
    "qld-planning-da-forms": [
      "Development application forms and templates",
      "Development application and change application forms"
    ],
    "brisbane-deck-guidance": [
      "Check if you need planning and building approval for your deck",
      "What do I need to know before getting started?"
    ],
    "brisbane-shed-guidance": [
      "Check if you need planning and building approval to build a shed",
      "What do I need to know before getting started?"
    ],
    "moreton-bay-building-permits": [
      "Building permits, approvals and final certificates",
      "Before you start construction, you may need a permit"
    ],
    "moreton-bay-domestic-outbuildings": [
      "Domestic outbuildings (sheds & carports)",
      "Domestic outbuilding means a non-habitable class 10a building"
    ],
    "sunshine-coast-what-needs-building-approval": [
      "Home Development Building What needs building approval",
      "What needs building approval A private building certifier can advise"
    ],
    "sunshine-coast-sheds": [
      "Home Development Building Sheds Sheds Find out if you need approval to build a shed",
      "Sheds Find out if you need approval to build a shed"
    ],
    "sunshine-coast-interactive-mapping": [
      "Home Development Planning documents Sunshine Coast Planning Scheme 2014 Interactive mapping",
      "Interactive mapping Easy access to Development.i and the Sunshine Coast mapping system"
    ]
  };

  const markers = sourceSpecificMarkers[sourceId] || [];

  for (const marker of markers) {
    const index = text.indexOf(marker);

    if (index !== -1) {
      return text.slice(index).trim();
    }
  }

  return text;
}

export function scoreBoilerplate(text) {
  const lower = text.toLowerCase();
  return boilerplateFragments.filter((fragment) => lower.includes(fragment)).length;
}

export function sanitizeChunkText(text) {
  let cleaned = cleanRetrievedText(text);

  for (const pattern of chunkRemovalPatterns) {
    cleaned = cleaned.replace(pattern, " ");
  }

  cleaned = cutBeforeMarker(cleaned, [
    "Home / Services and information / Building and development / Planning schemes /",
    "Home Development Building",
    "Home Development Planning documents",
    "Home Building and planning Getting started and approvals Residential projects",
    "Council Pay and Apply Living and community Council Environment",
    "Search Menu Close Home Starting a business",
    "Domestic outbuilding means a non-habitable class 10a building",
    "All sheds must comply with building standards",
    "The Building Code of Australia defines a shed as a Class 10a non-habitable building",
    "Before you start construction, you may need a permit"
  ]);

  cleaned = cleaned
    .replace(/\bHome( Development| Building and planning| \/ Services and information)[^.!?]{0,220}/gi, " ")
    .replace(/\bIn this section\b[^.!?]{0,220}/gi, " ")
    .replace(/\bOn this page\b[^.!?]{0,220}/gi, " ")
    .replace(/\bWhat do I need to know before getting started\?/gi, " ")
    .replace(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4}) \1\b/, "$1")
    .replace(/^(MBRC Planning Scheme - Domestic outbuildings \(sheds & carports\)) \1\b/i, "$1")
    .replace(/^[A-Z]{2,}\s+Planning Scheme\s+\/\s+Information sheets\s+\/\s+/i, " ")
    .replace(/^([^.!?]{10,120}) \1\b/i, "$1")
    .replace(/\bWhat types of approval do I need\?\b/gi, " ")
    .replace(/\bLodge a development application\b/gi, " ")
    .replace(/\bWhat happens after I lodge my development application\?\b/gi, " ")
    .replace(/\bInformation for building certifiers\b/gi, " ")
    .replace(/\s>\sWhat do I\b/gi, " ")
    .replace(/\bThis is called ['"]\s*/gi, "This is called ")
    .replace(/This is called ['‘’"]?\s*accepted/gi, "This is called accepted")
    .replace(/\s*['"]\s*\(/g, " (")
    .replace(/\)\s*['"]/g, ")")
    .replace(/\s+/g, " ")
    .trim();

  return dedupeAdjacentSentences(cleaned);
}

export function isLowSignalChunk(text) {
  const lower = text.toLowerCase();
  const tokenCount = text.split(/\s+/).filter(Boolean).length;

  if (scoreBoilerplate(text) >= 2) {
    return true;
  }

  if (tokenCount < 25) {
    return true;
  }

  if (lower.length < 120) {
    return true;
  }

  const positiveMarkers = [
    "approval",
    "building",
    "planning",
    "permit",
    "setback",
    "overlay",
    "development",
    "certifier",
    "code",
    "site report",
    "application",
    "class 10a",
    "structural",
    "drainage"
  ];

  return !positiveMarkers.some((marker) => lower.includes(marker));
}
