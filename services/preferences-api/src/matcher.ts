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
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=king%20street%20west",
    id: "craigslist-toronto-jarvis-suite",
    title: "Huge Clean Quiet Suite in Downtown Jarvis",
    priceUsd: 1400,
    address: "Jarvis Street, Downtown Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-huge-clean-quiet-basement/htfLdRyUNwV3QEE4HAkNjk",
    baseCommuteMinutes: {
      "union station": 12,
      "financial district": 5,
      "yonge & bloor": 15,
      "u of t": 18,
      default: 15,
      "financial district": 10,
      "yonge & bloor": 12,
      "u of t": 14,
      default: 12,
    },
  },
  {
    id: "bloor-one-bed-annex",
    title: "Renovated 1BR Apartment in The Annex",
    priceUsd: 1775,
    address: "700 Bloor Street West, Toronto, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=bloor%20street%20west",
    id: "craigslist-annex-bloor-spadina",
    title: "Cozy Furnished 1BR Suite at Bloor & Spadina",
    priceUsd: 1075,
    address: "Bloor St W & Spadina Ave, The Annex, Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-new-furnished-cozy-bd-bath-bsmt/gdYv8WkVJctoYMPnnqYcUx",
    baseCommuteMinutes: {
      "union station": 14,
      "financial district": 12,
      "yonge & bloor": 8,
      "u of t": 6,
      default: 10,
    },
  },
  {
    id: "craigslist-dufferin-grove-2br",
    title: "Dufferin Grove 2 Bedroom Apartment",
    priceUsd: 1600,
    address: "Dufferin Grove, Toronto, ON",
    url: "https://www.craigslist.org/view/d/west-toronto-dufferin-grove-bedroom/gJkXfsaWAUZBseoxSqazKE",
    baseCommuteMinutes: {
      "union station": 22,
      "financial district": 20,
      "yonge & bloor": 10,
      "u of t": 12,
      "yonge & bloor": 18,
      "u of t": 16,
      default: 20,
    },
  },
  {
    id: "queen-west-loft",
    title: "Chic Brick Loft near Trinity Bellwoods",
    priceUsd: 1850,
    address: "850 Queen Street West, Toronto, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=queen%20street%20west",
    id: "craigslist-danforth-birchmount",
    title: "Birchmount & Danforth Suite near Subway",
    priceUsd: 1600,
    address: "Birchmount Rd & Danforth Ave, Toronto, ON",
    url: "https://www.craigslist.org/view/d/scarborough-birchmounr-and-danforth/jsdEF3PCdP434Df3cDKSn4",
    baseCommuteMinutes: {
      "union station": 25,
      "financial district": 22,
      "yonge & bloor": 30,
      "u of t": 24,
      "union station": 28,
      "financial district": 26,
      "yonge & bloor": 20,
      "u of t": 25,
      default: 25,
    },
  },
  {
    id: "danforth-bachelor",
    title: "Cozy Bachelor Suite on Line 2 Subway",
    priceUsd: 1520,
    address: "420 Danforth Avenue, Toronto, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=danforth%20avenue",
    id: "craigslist-north-york-sheppard",
    title: "Spacious 1BR Apartment with Balcony",
    priceUsd: 1650,
    address: "Yonge & Sheppard, North York, ON",
    url: "https://www.craigslist.org/view/d/north-york-spacious-one-bedroom/qxCGsFPwXmiBAkuMJKiD2i",
    baseCommuteMinutes: {
      "union station": 28,
      "financial district": 26,
      "yonge & bloor": 14,
      "u of t": 22,
      default: 26,
      "yonge & bloor": 18,
      "u of t": 24,
      default: 25,
    },
  },
  {
    id: "kensington-shared-flat",
    title: "Bright Kensington Market Upper Flat",
    priceUsd: 1400,
    address: "180 Augusta Avenue, Toronto, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=kensington%20market",
    id: "craigslist-midtown-yonge-2br",
    title: "Bright 2 Bedroom Apartment near Transit",
    priceUsd: 1950,
    address: "Yonge St & Eglinton Ave, Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-bedroom-apartment/eF8VzWowEkK273vSYeoNoj",
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
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=queens%20quay",
    baseCommuteMinutes: {
      "union station": 14,
      "financial district": 18,
      "yonge & bloor": 28,
      "u of t": 26,
      "union station": 24,
      "financial district": 22,
      "yonge & bloor": 12,
      "u of t": 20,
      default: 20,
    },
  },
  {
    id: "midtown-yonge-eglinton",
    title: "Midtown 1BR Steps to Eglinton Subway",
    priceUsd: 1950,
    address: "2200 Yonge Street, Toronto, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=yonge%20eglinton",
    id: "craigslist-waterfront-1br-den",
    title: "1BR + Den Downtown Condo with Utilities",
    priceUsd: 2100,
    address: "Queens Quay & Bay St, Toronto, ON",
    url: "https://www.craigslist.org/view/d/downtown-toronto-bdr-plus-den-bth-condo/hpHQCwdsq3ogyFmuS4PofA",
    baseCommuteMinutes: {
      "union station": 29,
      "financial district": 27,
      "yonge & bloor": 16,
      "u of t": 25,
      default: 26,
      "union station": 10,
      "financial district": 12,
      "yonge & bloor": 22,
      "u of t": 20,
      default: 15,
    },
  },
  {
    id: "scarborough-town-centre",
    title: "Spacious 2BR Condo near Scarborough Centre",
    priceUsd: 1690,
    address: "300 Borough Drive, Scarborough, ON",
    url: "https://www.craigslist.org/search/area/toronto?cat=apa&query=borough%20drive%20scarborough",
    id: "craigslist-dundas-east-grid-condo",
    title: "Modern Grid Condos 1BR Suite on Dundas East",
    priceUsd: 2400,
    address: "181 Dundas Street East, Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-bed-plus-for-rent-grid-condos/24KtxtLG8oWRFRgBYrUMop",
    baseCommuteMinutes: {
      "union station": 52,
      "financial district": 50,
      "yonge & bloor": 44,
      "u of t": 55,
      default: 50,
      "union station": 14,
      "financial district": 12,
      "yonge & bloor": 15,
      "u of t": 15,
      default: 14,
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
      const savings = preferences.maxRentUsd - listing.priceUsd;
      const isGoodDeal = savings >= 100 || minutes <= Math.round(preferences.maxCommuteMinutes * 0.75);

      let dealReason = "";
      if (savings >= 100 && minutes <= Math.round(preferences.maxCommuteMinutes * 0.75)) {
        dealReason = `$${savings} under budget & fast ${minutes} min commute!`;
      } else if (savings >= 100) {
        dealReason = `$${savings} below budget ceiling`;
      } else if (minutes <= Math.round(preferences.maxCommuteMinutes * 0.75)) {
        dealReason = `Express commute: only ${minutes} min travel time`;
      }

      matched.push({
        id: listing.id,
        title: listing.title,
        priceUsd: listing.priceUsd,
        address: listing.address,
        url: listing.url,
        commuteMinutes: minutes,
        commuteSummary: `${minutes} min via ${modeLabel} to ${targetLabel}`,
        isGoodDeal,
        dealReason,
        matchedAt: now,
      });
    }
  }

  // Sort: Good deals first, then lowest commute time
  return matched.sort((a, b) => {
    if (a.isGoodDeal && !b.isGoodDeal) return -1;
    if (!a.isGoodDeal && b.isGoodDeal) return 1;
    return a.commuteMinutes - b.commuteMinutes;
  });
}
