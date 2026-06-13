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
