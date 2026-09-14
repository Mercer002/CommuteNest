import { describe, expect, it } from "vitest";
import { evaluateListing, isWithinBudget } from "../filters/listingFilter.js";
import type { CommuteResult, Listing, UserPreferences } from "../types.js";

const listing: Listing = {
  id: "listing-1",
  sourceName: "test",
  title: "Test listing",
  url: "https://example.test/listing-1",
  address: "100 King Street West, Toronto, ON",
  priceUsd: 1650,
};

const preferences: UserPreferences = {
  maxRentUsd: 1800,
  maxCommuteMinutes: 35,
  targetDestination: "Union Station, Toronto, ON",
  transitMode: "transit",
  transitModes: ["bus", "subway", "train"],
};

const commute: CommuteResult = {
  originAddress: listing.address,
  destinationAddress: preferences.targetDestination,
  durationSeconds: 30 * 60,
  durationMinutes: 30,
  provider: "mock",
};

describe("listing filters", () => {
  it("accepts listings within budget", () => {
    expect(isWithinBudget(listing, preferences)).toBe(true);
  });

  it("matches and flags good deal when rent savings >= $100", () => {
    const result = evaluateListing(listing, commute, preferences);
    expect(result.matches).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.isGoodDeal).toBe(true);
    expect(result.dealReason).toContain("$150 below budget ceiling");
  });

  it("matches and flags good deal when commute is fast (<= 75% of max)", () => {
    // price 1750 (savings $50 < $100), commute 20 min (20 <= round(35 * 0.75) = 26)
    const result = evaluateListing(
      { ...listing, priceUsd: 1750 },
      { ...commute, durationMinutes: 20 },
      preferences,
    );
    expect(result.matches).toBe(true);
    expect(result.isGoodDeal).toBe(true);
    expect(result.dealReason).toContain("Express commute: only 20 min");
  });

  it("matches but does NOT flag good deal when savings < $100 and commute > 75%", () => {
    // price 1750 (savings $50 < $100), commute 30 min (> 26 min)
    const result = evaluateListing(
      { ...listing, priceUsd: 1750 },
      { ...commute, durationMinutes: 30 },
      preferences,
    );
    expect(result.matches).toBe(true);
    expect(result.isGoodDeal).toBe(false);
    expect(result.dealReason).toBeUndefined();
  });

  it("returns reasons when a listing misses constraints", () => {
    const result = evaluateListing(
      { ...listing, priceUsd: 2100 },
      { ...commute, durationMinutes: 45, durationSeconds: 45 * 60 },
      preferences,
    );

    expect(result.matches).toBe(false);
    expect(result.isGoodDeal).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });

  it("filters by marketplace options: bedrooms, bathrooms, sqft, and amenities", () => {
    const richListing: Listing = {
      ...listing,
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 550,
      amenities: { gym: false, pool: false, laundry: true },
    };

    // Requires 2 bedrooms -> should fail
    const resBed = evaluateListing(richListing, commute, { ...preferences, minBedrooms: 2 });
    expect(resBed.matches).toBe(false);
    expect(resBed.reasons[0]).toContain("bedrooms");

    // Requires gym -> should fail
    const resGym = evaluateListing(richListing, commute, { ...preferences, hasGym: true });
    expect(resGym.matches).toBe(false);
    expect(resGym.reasons[0]).toContain("gym");

    // Requires min 600 sq ft -> should fail
    const resSqft = evaluateListing(richListing, commute, { ...preferences, minSquareFeet: 600 });
    expect(resSqft.matches).toBe(false);
    expect(resSqft.reasons[0]).toContain("square feet");

    // Matching criteria (laundry: true, minBedrooms: 1, maxBedrooms: 2) -> passes
    const resPass = evaluateListing(richListing, commute, {
      ...preferences,
      minBedrooms: 1,
      maxBedrooms: 2,
      minBathrooms: 1,
      hasLaundry: true,
    });
    expect(resPass.matches).toBe(true);
  });

  it("enforces multi-modal commute constraints across all selected modes", () => {
    const multiCommute: CommuteResult = {
      ...commute,
      durationMinutes: 15,
      breakdown: {
        transit: 15,
        driving: 10,
        walking: 45,
      },
    };

    // Walking AND driving selected, maxCommuteMinutes: 30 -> walking 45 exceeds 30
    const resFail = evaluateListing(listing, multiCommute, {
      ...preferences,
      maxCommuteMinutes: 30,
      selectedTransitModes: ["driving", "walking"],
    });
    expect(resFail.matches).toBe(false);
    expect(resFail.reasons[0]).toContain("walking commute 45 min exceeds 30 min");

    // Driving AND transit selected, maxCommuteMinutes: 30 -> both <= 30
    const resPass = evaluateListing(listing, multiCommute, {
      ...preferences,
      maxCommuteMinutes: 30,
      selectedTransitModes: ["driving", "transit"],
    });
    expect(resPass.matches).toBe(true);
  });
});
