import { propertyProfileContract } from "../app/contracts/property-profile.js";
import { lookupProperty } from "./adapters.js";

export function resolvePropertyProfile(intake) {
  return lookupProperty(intake).propertyProfile || null;
}

export function resolvePropertyLookup(intake) {
  return lookupProperty(intake);
}

export function enrichIntakeWithPropertyProfile(intake) {
  const lookup = lookupProperty(intake);
  const propertyProfile = lookup.propertyProfile;

  if (!propertyProfile) {
    return {
      intake,
      propertyProfile: null,
      propertyLookup: lookup
    };
  }

  const enriched = {
    ...intake,
    jurisdictionId: intake.jurisdictionId || propertyProfile.jurisdictionId,
    address: intake.address || propertyProfile.address,
    zone: intake.zone || propertyProfile.zone,
    zoneKnown: intake.zoneKnown ?? Boolean(propertyProfile.zone),
    overlays: Array.isArray(intake.overlays) && intake.overlays.length > 0 ? intake.overlays : propertyProfile.overlays,
    overlaysKnown: intake.overlaysKnown ?? Array.isArray(propertyProfile.overlays),
    currentUse: intake.currentUse || propertyProfile.currentUse || "residential"
  };

  return {
    intake: enriched,
    propertyProfile,
    propertyLookup: lookup
  };
}

export function hasOverlayReviewTrigger(propertyProfile) {
  if (!propertyProfile?.overlays?.length) {
    return false;
  }

  const triggers = propertyProfileContract.overlayReviewTriggers;
  return propertyProfile.overlays.some((overlay) =>
    triggers.some((trigger) => String(overlay).toLowerCase().includes(trigger))
  );
}
