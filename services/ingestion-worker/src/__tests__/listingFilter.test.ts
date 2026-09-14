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
});
