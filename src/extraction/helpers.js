export function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function findBetween(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);

  if (startIndex === -1) {
    return null;
  }

  const fromStart = text.slice(startIndex);

  if (!endMarker) {
    return normalizeWhitespace(fromStart);
  }

  const endIndex = fromStart.indexOf(endMarker);
  const section = endIndex === -1 ? fromStart : fromStart.slice(0, endIndex);
  return normalizeWhitespace(section);
}

export function extractBulletLikeItems(sectionText) {
  if (!sectionText) {
    return [];
  }

  const matches = sectionText.match(/(?:if:|if your [^:]+:)(.*)$/i);
  const baseText = matches ? matches[1] : sectionText;

  return baseText
    .split(/\b(?:and|;)\b/)
    .map((part) => normalizeWhitespace(part.replace(/^[-,:]\s*/, "")))
    .filter(Boolean);
}

export function createEvidenceRecord({
  source,
  snippet,
  normalizedClaim,
  confidence = 0.8,
  claimType,
  extractedAt,
  metadataPath
}) {
  return {
    sourceId: source.sourceId,
    sourceName: source.label,
    sourceType: source.type,
    sourceUrl: source.url,
    jurisdictionId: source.jurisdictionId,
    effectiveDate: null,
    retrievedAt: source.retrievedAt,
    sectionRef: source.title || null,
    pageRef: null,
    snippet,
    normalizedClaim,
    confidence,
    claimType,
    lineage: {
      rawObjectPath: source.rawPath,
      snapshotHash: source.hash,
      extractorVersion: "0.1.0",
      reviewStatus: "candidate",
      metadataPath
    }
  };
}
