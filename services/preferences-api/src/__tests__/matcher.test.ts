import { describe, expect, it } from "vitest";
import { findMatchingListings } from "../matcher.js";
import type { UserPreferencesRecord } from "../types.js";

describe("findMatchingListings", () => {
  const basePreferences: UserPreferencesRecord = {
    userId: "test-user",
    maxRentUsd: 2200,
    maxCommuteMinutes: 30,
    targetDestination: "Union Station, Toronto, ON",
    transitMode: "transit",
    transitModes: ["bus", "subway", "train"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("matches candidate listings within budget and commute time", () => {
    const matches = findMatchingListings(basePreferences);
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.priceUsd).toBeLessThanOrEqual(basePreferences.maxRentUsd);
      expect(match.commuteMinutes).toBeLessThanOrEqual(basePreferences.maxCommuteMinutes);
      expect(match.sourceName).toBeDefined();
      expect(match.commuteBreakdown).toBeDefined();
    }
  });

  it("filters by bedrooms when minBedrooms is specified", () => {
    const studioMatches = findMatchingListings({ ...basePreferences, minBedrooms: 0, maxBedrooms: 0 });
    expect(studioMatches.every((m) => m.bedrooms === 0)).toBe(true);

    const twoBedMatches = findMatchingListings({ ...basePreferences, minBedrooms: 2 });
    expect(twoBedMatches.length).toBeGreaterThan(0);
    expect(twoBedMatches.every((m) => (m.bedrooms ?? 0) >= 2)).toBe(true);
  });

  it("filters by amenities: gym, pool, laundry", () => {
    const gymMatches = findMatchingListings({ ...basePreferences, hasGym: true });
    expect(gymMatches.length).toBeGreaterThan(0);
    expect(gymMatches.every((m) => m.amenities?.gym === true)).toBe(true);

    const poolMatches = findMatchingListings({ ...basePreferences, hasPool: true });
    expect(poolMatches.length).toBeGreaterThan(0);
    expect(poolMatches.every((m) => m.amenities?.pool === true)).toBe(true);
  });

  it("enforces multi-modal commute limits across all selected modes", () => {
    // Select walking AND driving within 15 minutes
    const multiMatches = findMatchingListings({
      ...basePreferences,
      maxCommuteMinutes: 15,
      selectedTransitModes: ["driving", "walking"],
    });

    for (const match of multiMatches) {
      expect(match.commuteBreakdown?.driving).toBeLessThanOrEqual(15);
      expect(match.commuteBreakdown?.walking).toBeLessThanOrEqual(15);
    }
  });

  it("supports free-form destination addresses and calculates commute estimates", () => {
    const freeformMatches = findMatchingListings({
      ...basePreferences,
      targetDestination: "High Park, Toronto, ON",
      maxCommuteMinutes: 35,
    });

    expect(freeformMatches.length).toBeGreaterThan(0);
    for (const match of freeformMatches) {
      expect(match.commuteSummary).toContain("to High Park");
      expect(match.commuteMinutes).toBeLessThanOrEqual(35);
    }
  });
});

