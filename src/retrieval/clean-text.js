const replacementRules = [
  [/&nbsp;/gi, " "],
  [/&amp;/gi, "&"],
  [/&rsquo;|&#39;|&apos;/gi, "'"],
  [/&ldquo;|&rdquo;|&quot;/gi, "\""],
  [/&ndash;|&mdash;/gi, "-"],
  [/&gt;/gi, ">"],
  [/&lt;/gi, "<"],
  [/\\r\\n/gi, " "],
  [/\\n/gi, " "],
  [/\\t/gi, " "],
  [/â€™/gi, "'"],
  [/â€œ|â€/gi, "\""],
  [/â€“/gi, "-"],
  [/Â/g, " "]
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
  "general contacts"
];

export function cleanRetrievedText(text) {
  let cleaned = text;

  for (const [pattern, replacement] of replacementRules) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function trimToRelevantStart(text, sourceId) {
  const sourceSpecificMarkers = {
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

export function isLowSignalChunk(text) {
  const lower = text.toLowerCase();

  if (scoreBoilerplate(text) >= 2) {
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
    "application"
  ];

  return !positiveMarkers.some((marker) => lower.includes(marker));
}
