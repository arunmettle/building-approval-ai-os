function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function sentenceKey(claim) {
  return claim.sentenceId || claim.claimId;
}

function isClaimSupportedByCitation(claim, citations) {
  if (!claim.citationRefs.length) {
    return claim.type === "unknowns";
  }

  const supportingCitations = claim.citationRefs
    .map((ref) => citations[ref])
    .filter(Boolean);

  if (!supportingCitations.length) {
    return false;
  }

  if (!claim.supportTerms?.length) {
    return true;
  }

  const combinedCitationText = normalizeText(
    supportingCitations
      .map((citation) => `${citation.sectionRef || ""} ${citation.snippet || ""}`)
      .join(" ")
  );

  return claim.supportTerms.some((term) => combinedCitationText.includes(normalizeText(term)));
}

export function validateNarrativeClaims(claims, citations) {
  const results = claims.map((claim) => {
    const supported = isClaimSupportedByCitation(claim, citations);
    return {
      claimId: sentenceKey(claim),
      supported,
      citationRefs: claim.citationRefs
    };
  });

  const supportedClaims = claims.filter((claim) =>
    results.find((result) => result.claimId === sentenceKey(claim))?.supported
  );

  return {
    status: results.every((result) => result.supported) ? "passed" : "partial",
    results,
    supportedClaims
  };
}
