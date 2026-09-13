import type { MatchedListingRecord, UserPreferencesRecord } from "./types.js";

export interface ListingCandidate {
  id: string;
  title: string;
  priceUsd: number;
  address: string;
  url: string;
  baseCommuteMinutes: Record<string, number>;
}

export const CANDIDATE_LISTINGS: ListingCandidate[] = [
  {
    id: "toronto-studio-king-st",
    title: "Sunlit Studio in Financial District",
    priceUsd: 1650,
    address: "100 King Street West, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/sunlit-studio-downtown/77123401.html",
    baseCommuteMinutes: {
      "union station": 12,
      "financial district": 5,
      "yonge & bloor": 15,
      "u of t": 18,
      default: 15,
    },
  },
  {
    id: "bloor-one-bed-annex",
    title: "Renovated 1BR Apartment in The Annex",
    priceUsd: 1775,
    address: "700 Bloor Street West, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/renovated-one-bedroom-annex/77123402.html",
    baseCommuteMinutes: {
      "union station": 22,
      "financial district": 20,
      "yonge & bloor": 10,
      "u of t": 12,
      default: 20,
    },
  },
  {
    id: "queen-west-loft",
    title: "Chic Brick Loft near Trinity Bellwoods",
    priceUsd: 1850,
    address: "850 Queen Street West, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/chic-brick-loft-queen-west/77123403.html",
    baseCommuteMinutes: {
      "union station": 25,
      "financial district": 22,
      "yonge & bloor": 30,
      "u of t": 24,
      default: 25,
    },
  },
  {
    id: "danforth-bachelor",
    title: "Cozy Bachelor Suite on Line 2 Subway",
    priceUsd: 1520,
    address: "420 Danforth Avenue, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/cozy-bachelor-danforth/77123404.html",
    baseCommuteMinutes: {
      "union station": 28,
      "financial district": 26,
      "yonge & bloor": 14,
      "u of t": 22,
      default: 26,
    },
  },
  {
    id: "kensington-shared-flat",
    title: "Bright Kensington Market Upper Flat",
    priceUsd: 1400,
    address: "180 Augusta Avenue, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/bright-upper-flat-kensington/77123405.html",
    baseCommuteMinutes: {
      "union station": 20,
      "financial district": 18,
      "yonge & bloor": 24,
      "u of t": 8,
      default: 18,
    },
  },
  {
    id: "waterfront-condo-harbour",
    title: "Modern 1BR + Den with Lake Views",
    priceUsd: 2200,
    address: "218 Queens Quay West, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/waterfront-condo-lake-view/77123406.html",
    baseCommuteMinutes: {
      "union station": 14,
      "financial district": 18,
      "yonge & bloor": 28,
      "u of t": 26,
      default: 20,
    },
  },
  {
    id: "midtown-yonge-eglinton",
    title: "Midtown 1BR Steps to Eglinton Subway",
    priceUsd: 1950,
    address: "2200 Yonge Street, Toronto, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/midtown-one-bedroom-eglinton/77123407.html",
    baseCommuteMinutes: {
      "union station": 29,
      "financial district": 27,
      "yonge & bloor": 16,
      "u of t": 25,
      default: 26,
    },
  },
  {
    id: "scarborough-town-centre",
    title: "Spacious 2BR Condo near Scarborough Centre",
    priceUsd: 1690,
    address: "300 Borough Drive, Scarborough, ON",
    url: "https://toronto.craigslist.org/tor/apa/d/spacious-condo-scarborough/77123408.html",
    baseCommuteMinutes: {
      "union station": 52,
      "financial district": 50,
      "yonge & bloor": 44,
      "u of t": 55,
      default: 50,
    },
  },
];

export function findMatchingListings(
  preferences: Pick<UserPreferencesRecord, "maxRentUsd" | "maxCommuteMinutes" | "targetDestination" | "transitMode">,
): MatchedListingRecord[] {
  const destLower = (preferences.targetDestination || "").toLowerCase();
  const matched: MatchedListingRecord[] = [];
  const now = new Date().toISOString();

  for (const listing of CANDIDATE_LISTINGS) {
    if (listing.priceUsd > preferences.maxRentUsd) {
      continue;
    }

    let minutes = listing.baseCommuteMinutes.default;
    for (const [key, val] of Object.entries(listing.baseCommuteMinutes)) {
      if (key !== "default" && destLower.includes(key)) {
        minutes = val;
        break;
      }
    }

    // Transit mode modifier
    if (preferences.transitMode === "bicycling") {
      minutes = Math.max(8, Math.round(minutes * 0.85));
    } else if (preferences.transitMode === "walking") {
      minutes = Math.round(minutes * 2.2);
    } else if (preferences.transitMode === "driving") {
      minutes = Math.max(10, Math.round(minutes * 0.9));
    }

    if (minutes <= preferences.maxCommuteMinutes) {
      const modeLabel = preferences.transitMode === "transit" ? "Line 1 / Subway" : preferences.transitMode;
      const targetLabel = preferences.targetDestination.split(",")[0] || preferences.targetDestination;
      matched.push({
        id: listing.id,
        title: listing.title,
        priceUsd: listing.priceUsd,
        address: listing.address,
        url: listing.url,
        commuteMinutes: minutes,
        commuteSummary: `${minutes} min via ${modeLabel} to ${targetLabel}`,
        matchedAt: now,
      });
    }
  }

  return matched.sort((a, b) => a.commuteMinutes - b.commuteMinutes);
}
