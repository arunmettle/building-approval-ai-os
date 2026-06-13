function isClaimSupportedByCitation(claim, citations) {
  if (!claim.citationRefs.length) {
    return claim.type === "unknowns" || claim.type === "review";
  }

  return claim.citationRefs.every((ref) => citations[ref]);
}

export function validateNarrativeClaims(claims, citations) {
  const results = claims.map((claim) => {
    const supported = isClaimSupportedByCitation(claim, citations);
    return {
      claimId: claim.claimId,
      supported,
      citationRefs: claim.citationRefs
    };
  });

  const supportedClaims = claims.filter((claim) =>
    results.find((result) => result.claimId === claim.claimId)?.supported
  );

  return {
    status: results.every((result) => result.supported) ? "passed" : "partial",
    results,
    supportedClaims
  };
}
