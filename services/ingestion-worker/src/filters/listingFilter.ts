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
