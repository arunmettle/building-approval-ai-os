import {
  queenslandPilotJurisdictions,
  queenslandStateBaseline
} from "../app/jurisdictions/qld-pilots.js";

function toRegistryEntry(source, scope) {
  return {
    sourceId: source.sourceId,
    label: source.label,
    type: source.type,
    url: source.url,
    freshnessExpectationDays: source.freshnessExpectationDays,
    requiresManualReview: source.requiresManualReview,
    jurisdictionId: scope.jurisdictionId,
    jurisdictionLabel:
      scope.label || scope.localAuthority || scope.stateOrProvince || scope.country,
    scopeType: scope.scope || "local"
  };
}

export function buildSourceRegistry() {
  const stateEntries = queenslandStateBaseline.sourceCatalog.map((source) =>
    toRegistryEntry(source, queenslandStateBaseline)
  );

  const pilotEntries = queenslandPilotJurisdictions.flatMap((jurisdiction) =>
    jurisdiction.sourceCatalog.map((source) => toRegistryEntry(source, jurisdiction))
  );

  return [...stateEntries, ...pilotEntries];
}
