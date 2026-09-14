import type { CommuteResult, Listing, MatchedListing, UserPreferences } from "../types.js";

export interface ListingEvaluation {
  matches: boolean;
  reasons: string[];
  isGoodDeal: boolean;
  dealReason?: string;
}

export function isWithinBudget(listing: Listing, preferences: UserPreferences): boolean {
  return listing.priceUsd <= preferences.maxRentUsd;
}

export function evaluateListing(
  listing: Listing,
  commute: CommuteResult,
  preferences: UserPreferences,
): ListingEvaluation {
  const reasons: string[] = [];

  if (!isWithinBudget(listing, preferences)) {
    reasons.push(`rent ${formatUsd(listing.priceUsd)} exceeds ${formatUsd(preferences.maxRentUsd)}`);
  }

  if (commute.durationMinutes > preferences.maxCommuteMinutes) {
    reasons.push(`commute ${commute.durationMinutes} min exceeds ${preferences.maxCommuteMinutes} min`);
  }

  // Optional multi-modal breakdown check
  if (commute.breakdown) {
    const activeModes = preferences.selectedTransitModes && preferences.selectedTransitModes.length > 0
      ? preferences.selectedTransitModes
      : [preferences.transitMode];

    for (const mode of activeModes) {
      const duration = commute.breakdown[mode];
      if (duration !== undefined && duration > preferences.maxCommuteMinutes) {
        reasons.push(`${mode} commute ${duration} min exceeds ${preferences.maxCommuteMinutes} min`);
      }
    }
  }

  // Optional marketplace filters
  if (preferences.minBedrooms !== undefined && (listing.bedrooms ?? 0) < preferences.minBedrooms) {
    reasons.push(`bedrooms ${listing.bedrooms ?? 0} below minimum ${preferences.minBedrooms}`);
  }
  if (preferences.maxBedrooms !== undefined && (listing.bedrooms ?? 0) > preferences.maxBedrooms) {
    reasons.push(`bedrooms ${listing.bedrooms ?? 0} exceeds maximum ${preferences.maxBedrooms}`);
  }
  if (preferences.minBathrooms !== undefined && (listing.bathrooms ?? 0) < preferences.minBathrooms) {
    reasons.push(`bathrooms ${listing.bathrooms ?? 0} below minimum ${preferences.minBathrooms}`);
  }
  if (preferences.minSquareFeet !== undefined && (listing.squareFeet ?? 0) < preferences.minSquareFeet) {
    reasons.push(`square feet ${listing.squareFeet ?? 0} below minimum ${preferences.minSquareFeet}`);
  }
  if (preferences.maxSquareFeet !== undefined && (listing.squareFeet ?? 0) > preferences.maxSquareFeet) {
    reasons.push(`square feet ${listing.squareFeet ?? 0} exceeds maximum ${preferences.maxSquareFeet}`);
  }

  // Optional amenity checks
  if (preferences.hasGym && !listing.amenities?.gym) {
    reasons.push("lacks gym in building");
  }
  if (preferences.hasPool && !listing.amenities?.pool) {
    reasons.push("lacks swimming pool");
  }
  if (preferences.hasLaundry && !listing.amenities?.laundry) {
    reasons.push("lacks laundry");
  }
  if (preferences.utilitiesIncluded && !listing.amenities?.utilitiesIncluded) {
    reasons.push("utilities not included");
  }
  if (preferences.hasParking && !listing.amenities?.parking) {
    reasons.push("lacks parking");
  }
  if (preferences.petFriendly && !listing.amenities?.petFriendly) {
    reasons.push("not pet friendly");
  }
  if (preferences.furnished && !listing.amenities?.furnished) {
    reasons.push("not furnished");
  }
  if (preferences.airConditioning && !listing.amenities?.airConditioning) {
    reasons.push("lacks air conditioning");
  }
  if (preferences.hasBalcony && !listing.amenities?.balcony) {
    reasons.push("lacks balcony");
  }

  const matches = reasons.length === 0;
  let isGoodDeal = false;
  let dealReason: string | undefined;

  if (matches) {
    const savings = preferences.maxRentUsd - listing.priceUsd;
    const fastCommuteThreshold = Math.round(preferences.maxCommuteMinutes * 0.75);
    const isFastCommute = commute.durationMinutes <= fastCommuteThreshold;
    const isUnderBudget = savings >= 100;

    isGoodDeal = isUnderBudget || isFastCommute;
    if (isUnderBudget && isFastCommute) {
      dealReason = `$${savings} under budget & fast ${commute.durationMinutes} min commute!`;
    } else if (isUnderBudget) {
      dealReason = `$${savings} below budget ceiling`;
    } else if (isFastCommute) {
      dealReason = `Express commute: only ${commute.durationMinutes} min travel time`;
    }
  }

  return {
    matches,
    reasons,
    isGoodDeal,
    dealReason,
  };
}

export function renderAlertMessage(match: MatchedListing): string {
  const { listing, commute } = match;

  const header = match.isGoodDeal
    ? `🔥 CommuteNest Good Deal Alert: ${listing.title}`
    : `CommuteNest match: ${listing.title}`;

  const lines = [
    header,
    `${formatUsd(listing.priceUsd)}/mo, ${commute.durationMinutes} min commute`,
    listing.address,
  ];

  if (match.dealReason) {
    lines.push(`Why it's a deal: ${match.dealReason}`);
  }

  lines.push(`Listing URL: ${listing.url}`);

  return lines.join("\n");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
