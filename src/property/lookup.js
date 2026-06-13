import fs from "node:fs";
import path from "node:path";
import { propertyProfileContract } from "../app/contracts/property-profile.js";

function readPropertyProfiles() {
  const profilesPath = path.resolve(process.cwd(), "data", "property", "profiles.json");

  if (!fs.existsSync(profilesPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertProfile(profile) {
  for (const field of propertyProfileContract.requiredFields) {
    if (!(field in profile)) {
      throw new Error(`Property profile missing required field: ${field}`);
    }
  }
}

function deriveLookupCandidates(intake) {
  return [
    intake.propertyProfileId,
    intake.propertyLookupKey,
    intake.address,
    intake.lotPlan
  ]
    .filter(Boolean)
    .map(normalizeKey);
}

export function resolvePropertyProfile(intake) {
  const profiles = readPropertyProfiles();
  const candidates = deriveLookupCandidates(intake);

  for (const profile of profiles) {
    assertProfile(profile);
    const profileKeys = [
      profile.propertyProfileId,
      profile.lookupKey,
      profile.address,
      ...(profile.aliases || [])
    ].map(normalizeKey);

    if (candidates.some((candidate) => profileKeys.includes(candidate))) {
      return profile;
    }
  }

  return null;
}

export function enrichIntakeWithPropertyProfile(intake) {
  const propertyProfile = resolvePropertyProfile(intake);

  if (!propertyProfile) {
    return {
      intake,
      propertyProfile: null
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
    propertyProfile
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
