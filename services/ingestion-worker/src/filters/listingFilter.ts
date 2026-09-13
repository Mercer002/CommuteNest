import type { CommuteResult, Listing, MatchedListing, UserPreferences } from "../types.js";

export interface ListingEvaluation {
  matches: boolean;
  reasons: string[];
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

  return {
    matches: reasons.length === 0,
    reasons,
  };
}

export function renderAlertMessage(match: MatchedListing): string {
  const { listing, commute } = match;

  return [
    `CommuteNest match: ${listing.title}`,
    `${formatUsd(listing.priceUsd)}/mo, ${commute.durationMinutes} min commute`,
    listing.address,
    listing.url,
  ].join("\n");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
