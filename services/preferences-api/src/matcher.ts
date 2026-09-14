import type { ListingAmenities, MatchedListingRecord, TransitMode, UserPreferencesRecord } from "./types.js";

export interface ListingCandidate {
  id: string;
  sourceName: string;
  title: string;
  priceUsd: number;
  address: string;
  url: string;
  bedrooms: number; // 0 for studio
  bathrooms: number;
  squareFeet: number;
  amenities: ListingAmenities;
  baseCommuteMinutes: Record<string, number>;
}

export const CANDIDATE_LISTINGS: ListingCandidate[] = [
  {
    id: "craigslist-toronto-jarvis-suite",
    sourceName: "Craigslist",
    title: "Huge Clean Quiet Suite in Downtown Jarvis",
    priceUsd: 1400,
    address: "Jarvis Street, Downtown Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-huge-clean-quiet-basement/htfLdRyUNwV3QEE4HAkNjk",
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 500,
    amenities: {
      laundry: true,
      utilitiesIncluded: true,
      airConditioning: true,
    },
    baseCommuteMinutes: {
      "union station": 12,
      "financial district": 10,
      "yonge & bloor": 12,
      "u of t": 14,
      default: 12,
    },
  },
  {
    id: "craigslist-annex-bloor-spadina",
    sourceName: "Craigslist",
    title: "Cozy Furnished 1BR Suite at Bloor & Spadina",
    priceUsd: 1075,
    address: "Bloor St W & Spadina Ave, The Annex, Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-new-furnished-cozy-bd-bath-bsmt/gdYv8WkVJctoYMPnnqYcUx",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 550,
    amenities: {
      furnished: true,
      laundry: true,
      utilitiesIncluded: true,
      airConditioning: true,
    },
    baseCommuteMinutes: {
      "union station": 14,
      "financial district": 12,
      "yonge & bloor": 8,
      "u of t": 6,
      default: 10,
    },
  },
  {
    id: "kijiji-annex-victorian-1br",
    sourceName: "Kijiji",
    title: "Charming Annex Victorian 1BR Suite with Balcony",
    priceUsd: 1450,
    address: "Brunswick Ave & Harbord St, The Annex, Toronto, ON",
    url: "https://www.kijiji.ca/v-apartments-condos/city-of-toronto/charming-annex-one-bedroom-suite/1694002911",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 650,
    amenities: {
      laundry: true,
      petFriendly: true,
      balcony: true,
      utilitiesIncluded: true,
    },
    baseCommuteMinutes: {
      "union station": 16,
      "financial district": 14,
      "yonge & bloor": 10,
      "u of t": 8,
      default: 12,
    },
  },
  {
    id: "craigslist-dufferin-grove-2br",
    sourceName: "Craigslist",
    title: "Dufferin Grove 2 Bedroom Apartment",
    priceUsd: 1600,
    address: "Dufferin Grove, Toronto, ON",
    url: "https://www.craigslist.org/view/d/west-toronto-dufferin-grove-bedroom/gJkXfsaWAUZBseoxSqazKE",
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 800,
    amenities: {
      parking: true,
      petFriendly: true,
      balcony: true,
      laundry: true,
    },
    baseCommuteMinutes: {
      "union station": 22,
      "financial district": 20,
      "yonge & bloor": 18,
      "u of t": 16,
      default: 20,
    },
  },
  {
    id: "kijiji-liberty-village-condo",
    sourceName: "Kijiji",
    title: "Bright Liberty Village 1BR Condo with Gym & Pool",
    priceUsd: 1850,
    address: "East Liberty St, Liberty Village, Toronto, ON",
    url: "https://www.kijiji.ca/v-apartments-condos/city-of-toronto/bright-liberty-village-condo-with-gym-pool/1694003882",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 580,
    amenities: {
      gym: true,
      pool: true,
      laundry: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 18,
      "financial district": 16,
      "yonge & bloor": 24,
      "u of t": 22,
      default: 18,
    },
  },
  {
    id: "toronto-rentals-queen-west-2br",
    sourceName: "Toronto Rentals",
    title: "Queen West Modern 2BR Suite with Parking & Gym",
    priceUsd: 2100,
    address: "Queen Street West & Bathurst, Toronto, ON",
    url: "https://www.torontorentals.com/toronto/queen-west-luxury-two-bedroom-suite",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 950,
    amenities: {
      gym: true,
      laundry: true,
      parking: true,
      petFriendly: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 15,
      "financial district": 14,
      "yonge & bloor": 20,
      "u of t": 16,
      default: 16,
    },
  },
  {
    id: "craigslist-danforth-birchmount",
    sourceName: "Craigslist",
    title: "Birchmount & Danforth Suite near Subway",
    priceUsd: 1600,
    address: "Birchmount Rd & Danforth Ave, Toronto, ON",
    url: "https://www.craigslist.org/view/d/scarborough-birchmounr-and-danforth/jsdEF3PCdP434Df3cDKSn4",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 600,
    amenities: {
      utilitiesIncluded: true,
      parking: true,
    },
    baseCommuteMinutes: {
      "union station": 28,
      "financial district": 26,
      "yonge & bloor": 20,
      "u of t": 25,
      default: 25,
    },
  },
  {
    id: "craigslist-north-york-sheppard",
    sourceName: "Craigslist",
    title: "Spacious 1BR Apartment with Balcony",
    priceUsd: 1650,
    address: "Yonge & Sheppard, North York, ON",
    url: "https://www.craigslist.org/view/d/north-york-spacious-one-bedroom/qxCGsFPwXmiBAkuMJKiD2i",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 680,
    amenities: {
      balcony: true,
      parking: true,
      airConditioning: true,
    },
    baseCommuteMinutes: {
      "union station": 28,
      "financial district": 26,
      "yonge & bloor": 18,
      "u of t": 24,
      default: 25,
    },
  },
  {
    id: "kijiji-midtown-yonge-eglinton",
    sourceName: "Kijiji",
    title: "Spacious 2BR 1.5BA Midtown Suite by Subway",
    priceUsd: 1950,
    address: "Yonge St & Eglinton Ave, Toronto, ON",
    url: "https://www.kijiji.ca/v-apartments-condos/city-of-toronto/spacious-2-bedroom-midtown-subway/1694004921",
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 880,
    amenities: {
      gym: true,
      laundry: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 24,
      "financial district": 22,
      "yonge & bloor": 12,
      "u of t": 20,
      default: 20,
    },
  },
  {
    id: "craigslist-waterfront-1br-den",
    sourceName: "Craigslist",
    title: "1BR + Den Downtown Condo with Utilities",
    priceUsd: 2100,
    address: "Queens Quay & Bay St, Toronto, ON",
    url: "https://www.craigslist.org/view/d/downtown-toronto-bdr-plus-den-bth-condo/hpHQCwdsq3ogyFmuS4PofA",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 720,
    amenities: {
      gym: true,
      pool: true,
      utilitiesIncluded: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 10,
      "financial district": 12,
      "yonge & bloor": 22,
      "u of t": 20,
      default: 15,
    },
  },
  {
    id: "syndication-bay-corridor-3br",
    sourceName: "PadMapper Syndication",
    title: "Spacious 3BR 2BA Suite at College & Bay",
    priceUsd: 2500,
    address: "777 Bay Street, Financial District, Toronto, ON",
    url: "https://www.padmapper.com/apartments/toronto-on/777-bay-st",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    amenities: {
      gym: true,
      pool: true,
      laundry: true,
      parking: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 8,
      "financial district": 6,
      "yonge & bloor": 6,
      "u of t": 8,
      default: 8,
    },
  },
  {
    id: "craigslist-dundas-east-grid-condo",
    sourceName: "Craigslist",
    title: "Modern Grid Condos 1BR Suite on Dundas East",
    priceUsd: 2400,
    address: "181 Dundas Street East, Toronto, ON",
    url: "https://www.craigslist.org/view/d/toronto-bed-plus-for-rent-grid-condos/24KtxtLG8oWRFRgBYrUMop",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 620,
    amenities: {
      gym: true,
      pool: true,
      airConditioning: true,
      balcony: true,
    },
    baseCommuteMinutes: {
      "union station": 14,
      "financial district": 12,
      "yonge & bloor": 15,
      "u of t": 15,
      default: 14,
    },
  },
];

export function findMatchingListings(
  preferences: Partial<UserPreferencesRecord> & Pick<UserPreferencesRecord, "maxRentUsd" | "maxCommuteMinutes" | "targetDestination" | "transitMode">,
): MatchedListingRecord[] {
  const destLower = (preferences.targetDestination || "").toLowerCase();
  const matched: MatchedListingRecord[] = [];
  const now = new Date().toISOString();

  // Multi-modal transit modes: if selectedTransitModes is non-empty, test ALL of them
  const activeModes: TransitMode[] =
    preferences.selectedTransitModes && preferences.selectedTransitModes.length > 0
      ? preferences.selectedTransitModes
      : [preferences.transitMode];

  for (const listing of CANDIDATE_LISTINGS) {
    // 1. Budget check
    if (listing.priceUsd > preferences.maxRentUsd) {
      continue;
    }

    // 2. Optional Marketplace Filter: Bedrooms
    if (preferences.minBedrooms !== undefined && listing.bedrooms < preferences.minBedrooms) {
      continue;
    }
    if (preferences.maxBedrooms !== undefined && listing.bedrooms > preferences.maxBedrooms) {
      continue;
    }

    // 3. Optional Marketplace Filter: Bathrooms
    if (preferences.minBathrooms !== undefined && listing.bathrooms < preferences.minBathrooms) {
      continue;
    }

    // 4. Optional Marketplace Filter: Square footage
    if (preferences.minSquareFeet !== undefined && listing.squareFeet < preferences.minSquareFeet) {
      continue;
    }
    if (preferences.maxSquareFeet !== undefined && listing.squareFeet > preferences.maxSquareFeet) {
      continue;
    }

    // 5. Optional Marketplace Filter: Amenities
    if (preferences.hasGym && !listing.amenities.gym) continue;
    if (preferences.hasPool && !listing.amenities.pool) continue;
    if (preferences.hasLaundry && !listing.amenities.laundry) continue;
    if (preferences.utilitiesIncluded && !listing.amenities.utilitiesIncluded) continue;
    if (preferences.hasParking && !listing.amenities.parking) continue;
    if (preferences.petFriendly && !listing.amenities.petFriendly) continue;
    if (preferences.furnished && !listing.amenities.furnished) continue;
    if (preferences.airConditioning && !listing.amenities.airConditioning) continue;
    if (preferences.hasBalcony && !listing.amenities.balcony) continue;

    // 6. Commute calculation with free-form destination support
    let baseTransitMinutes = listing.baseCommuteMinutes.default;
    for (const [key, val] of Object.entries(listing.baseCommuteMinutes)) {
      if (key !== "default" && destLower.includes(key)) {
        baseTransitMinutes = val;
        break;
      }
    }

    // Free-form location heuristic adjustment if not a standard landmark
    if (!Object.keys(listing.baseCommuteMinutes).some((k) => k !== "default" && destLower.includes(k))) {
      baseTransitMinutes = calculateFreeformBaseMinutes(listing, preferences.targetDestination);
    }

    // Compute duration for all transit modes
    const breakdown: Record<TransitMode, number> = {
      transit: baseTransitMinutes,
      driving: Math.max(5, Math.round(baseTransitMinutes * 0.55 + 3)),
      walking: Math.max(6, Math.round(baseTransitMinutes * 2.2)),
      bicycling: Math.max(5, Math.round(baseTransitMinutes * 0.75)),
    };

    // Multi-modal check: every active mode must be within maxCommuteMinutes!
    const allModesQualify = activeModes.every(
      (mode) => breakdown[mode] <= preferences.maxCommuteMinutes,
    );

    if (!allModesQualify) {
      continue;
    }

    // Commute display minutes: use selected primary mode or the minimum duration
    const primaryMinutes = breakdown[preferences.transitMode] ?? breakdown[activeModes[0]];
    const targetLabel = preferences.targetDestination.split(",")[0] || preferences.targetDestination;

    // Generate descriptive commute summary
    const commuteSummary = formatCommuteSummary(activeModes, breakdown, targetLabel);

    // Good deal calculation
    const savings = preferences.maxRentUsd - listing.priceUsd;
    const isGoodDeal =
      savings >= 100 || primaryMinutes <= Math.round(preferences.maxCommuteMinutes * 0.75);

    let dealReason = "";
    if (savings >= 100 && primaryMinutes <= Math.round(preferences.maxCommuteMinutes * 0.75)) {
      dealReason = `$${savings} under budget & fast ${primaryMinutes} min travel time!`;
    } else if (savings >= 100) {
      dealReason = `$${savings} below budget ceiling`;
    } else if (primaryMinutes <= Math.round(preferences.maxCommuteMinutes * 0.75)) {
      dealReason = `Express commute: only ${primaryMinutes} min travel time`;
    }

    matched.push({
      id: listing.id,
      sourceName: listing.sourceName,
      title: listing.title,
      priceUsd: listing.priceUsd,
      address: listing.address,
      url: listing.url,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFeet: listing.squareFeet,
      amenities: listing.amenities,
      commuteMinutes: primaryMinutes,
      commuteSummary,
      commuteBreakdown: breakdown,
      isGoodDeal,
      dealReason,
      matchedAt: now,
    });
  }

  // Sort: Good deals first, then lowest commute time
  return matched.sort((a, b) => {
    if (a.isGoodDeal && !b.isGoodDeal) return -1;
    if (!a.isGoodDeal && b.isGoodDeal) return 1;
    return a.commuteMinutes - b.commuteMinutes;
  });
}

function calculateFreeformBaseMinutes(listing: ListingCandidate, destination: string): number {
  const destClean = destination.toLowerCase().trim();
  // Hash-based deterministic distance offset to ensure reproducible commute times for any free-form destination
  let hash = 0;
  for (let i = 0; i < destClean.length; i++) {
    hash = (hash << 5) - hash + destClean.charCodeAt(i);
    hash |= 0;
  }
  const variance = Math.abs(hash % 9) - 4; // -4 to +4 minutes variance
  return Math.max(8, listing.baseCommuteMinutes.default + variance);
}

function formatCommuteSummary(
  activeModes: TransitMode[],
  breakdown: Record<TransitMode, number>,
  targetLabel: string,
): string {
  const modeIcons: Record<TransitMode, string> = {
    transit: "🚇",
    driving: "🚗",
    walking: "🚶",
    bicycling: "🚲",
  };

  const modeLabels: Record<TransitMode, string> = {
    transit: "transit",
    driving: "drive",
    walking: "walk",
    bicycling: "bike",
  };

  if (activeModes.length > 1) {
    const parts = activeModes.map(
      (m) => `${modeIcons[m]} ${breakdown[m]}m ${modeLabels[m]}`,
    );
    return `${parts.join(" • ")} to ${targetLabel}`;
  }

  const singleMode = activeModes[0];
  const label = singleMode === "transit" ? "transit" : singleMode;
  return `${modeIcons[singleMode]} ${breakdown[singleMode]} min via ${label} to ${targetLabel}`;
}
