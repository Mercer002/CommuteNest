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

  it("matches when rent and commute are within preferences", () => {
    expect(evaluateListing(listing, commute, preferences)).toEqual({
      matches: true,
      reasons: [],
    });
  });

  it("returns reasons when a listing misses constraints", () => {
    const result = evaluateListing(
      { ...listing, priceUsd: 2100 },
      { ...commute, durationMinutes: 45, durationSeconds: 45 * 60 },
      preferences,
    );

    expect(result.matches).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });
});
