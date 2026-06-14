import fs from "node:fs";
import path from "node:path";
import { propertyProfileContract } from "../app/contracts/property-profile.js";

function readPropertyProfiles() {
  const profilesPath = path.resolve(process.cwd(), "src", "property", "profiles.json");

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

function findFixtureProfile(intake) {
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

function portalLookupResult({ adapterId, jurisdictionId, address, label, portalUrl, searchHints, propertyProfile }) {
  return {
    adapterId,
    jurisdictionId,
    status: propertyProfile ? "resolved-from-fixture-with-live-portal" : "manual-portal-required",
    propertyProfile,
    sources: [
      {
        label,
        url: portalUrl,
        type: "official-property-lookup-portal"
      }
    ],
    searchHints
  };
}

export const propertyLookupAdapters = [
  {
    adapterId: "fixture-profiles",
    supports(intake) {
      return Boolean(findFixtureProfile(intake));
    },
    lookup(intake) {
      const propertyProfile = findFixtureProfile(intake);

      return {
        adapterId: "fixture-profiles",
        jurisdictionId: propertyProfile?.jurisdictionId || intake.jurisdictionId || null,
        status: propertyProfile ? "resolved" : "not-found",
        propertyProfile,
        sources: propertyProfile?.sources || [],
        searchHints: propertyProfile
          ? {
              recommendedFields: ["propertyProfileId", "propertyLookupKey", "address", "lotPlan"],
              note: "Resolved from seeded local property fixtures."
            }
          : null
      };
    }
  },
  {
    adapterId: "sunshine-coast-live-portal",
    supports(intake) {
      return (intake.jurisdictionId || "").includes("sunshine-coast");
    },
    lookup(intake) {
      return portalLookupResult({
        adapterId: "sunshine-coast-live-portal",
        jurisdictionId: "au-qld-sunshine-coast",
        address: intake.address || null,
        label: "Development.i site report",
        portalUrl: "https://www.sunshinecoast.qld.gov.au/development/development-tools-and-guidelines/development-i-site-report",
        searchHints: {
          recommendedFields: ["address"],
          note: "Use Development.i site report or MyMaps to confirm zoning, overlays, and planning details for a property.",
          secondaryPortal: "https://www.sunshinecoast.qld.gov.au/development/planning-documents/sunshine-coast-planning-scheme-2014/interactive-mapping"
        },
        propertyProfile: findFixtureProfile(intake)
      });
    }
  },
  {
    adapterId: "moreton-bay-live-portal",
    supports(intake) {
      return (intake.jurisdictionId || "").includes("moreton-bay");
    },
    lookup(intake) {
      return portalLookupResult({
        adapterId: "moreton-bay-live-portal",
        jurisdictionId: "au-qld-moreton-bay",
        address: intake.address || null,
        label: "My property look up",
        portalUrl: "https://www.moretonbay.qld.gov.au/Services/Building-Development/Planning-Schemes/My-Property-Look-Up",
        searchHints: {
          recommendedFields: ["address"],
          note: "Use My Property Look Up to inspect zone, precinct, and overlays affecting the property."
        },
        propertyProfile: findFixtureProfile(intake)
      });
    }
  },
  {
    adapterId: "brisbane-live-portal",
    supports(intake) {
      return (intake.jurisdictionId || "").includes("brisbane");
    },
    lookup(intake) {
      return portalLookupResult({
        adapterId: "brisbane-live-portal",
        jurisdictionId: "au-qld-brisbane",
        address: intake.address || null,
        label: "City Plan online",
        portalUrl: "https://www.brisbane.qld.gov.au/building-and-planning/supporting-documents-and-online-tools/city-plan-online",
        searchHints: {
          recommendedFields: ["address", "lotPlan"],
          note: "Use City Plan online interactive mapping to inspect property-specific zones, overlays, and neighborhood plans."
        },
        propertyProfile: findFixtureProfile(intake)
      });
    }
  }
];

export function lookupProperty(intake, preferredMode = process.env.PROPERTY_LOOKUP_MODE || "hybrid") {
  const fixtureResult = propertyLookupAdapters[0].lookup(intake);

  if (preferredMode === "fixture-only") {
    return fixtureResult;
  }

  const adapter = propertyLookupAdapters
    .slice(1)
    .find((candidate) => candidate.supports(intake));

  if (!adapter) {
    return fixtureResult;
  }

  const liveResult = adapter.lookup(intake);

  if (preferredMode === "live-only") {
    return liveResult;
  }

  if (liveResult.propertyProfile) {
    return liveResult;
  }

  if (fixtureResult.propertyProfile) {
    return fixtureResult;
  }

  return liveResult;
}
