import { describe, expect, it } from "vitest";
import { validateUpdatePreferencesInput, validateUserId } from "../validator.js";

describe("validateUserId", () => {
  it("accepts valid alphanumeric user IDs", () => {
    expect(validateUserId("mercer")).toEqual({ valid: true, data: "mercer" });
    expect(validateUserId("user-123_abc")).toEqual({ valid: true, data: "user-123_abc" });
  });

  it("rejects invalid user IDs", () => {
    expect(validateUserId("")).toEqual({
      valid: false,
      errors: ["userId is required and must be a string."],
    });
    expect(validateUserId("bad user id with spaces")).toEqual({
      valid: false,
      errors: ["userId must be 1-64 characters containing only alphanumeric characters, hyphens, and underscores."],
    });
  });
});

describe("validateUpdatePreferencesInput", () => {
  const validPayload = {
    maxRentUsd: 1800,
    maxCommuteMinutes: 35,
    targetDestination: "Union Station, Toronto, ON",
    transitMode: "transit",
    transitModes: ["subway", "train"],
    notificationEmail: "demo@example.com",
  };

  it("accepts complete valid input", () => {
    const result = validateUpdatePreferencesInput(validPayload);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.maxRentUsd).toBe(1800);
      expect(result.data.maxCommuteMinutes).toBe(35);
      expect(result.data.targetDestination).toBe("Union Station, Toronto, ON");
      expect(result.data.transitMode).toBe("transit");
      expect(result.data.notificationEmail).toBe("demo@example.com");
    }
  });

  it("rejects invalid rent and commute values", () => {
    const result = validateUpdatePreferencesInput({
      ...validPayload,
      maxRentUsd: -500,
      maxCommuteMinutes: 0,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain("maxRentUsd must be a positive number up to 100,000.");
      expect(result.errors).toContain("maxCommuteMinutes must be a positive integer between 1 and 300 minutes.");
    }
  });

  it("rejects invalid transit mode", () => {
    const result = validateUpdatePreferencesInput({
      ...validPayload,
      transitMode: "teleportation",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("transitMode must be one of"))).toBe(true);
    }
  });

  it("rejects invalid email address format", () => {
    const result = validateUpdatePreferencesInput({
      ...validPayload,
      notificationEmail: "not-an-email",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain("notificationEmail must be a valid email address.");
    }
  });

  it("accepts valid marketplace filters and selectedTransitModes", () => {
    const result = validateUpdatePreferencesInput({
      ...validPayload,
      selectedTransitModes: ["driving", "walking"],
      minBedrooms: 1,
      maxBedrooms: 2,
      minBathrooms: 1.5,
      minSquareFeet: 500,
      maxSquareFeet: 1200,
      hasGym: true,
      hasPool: false,
      hasLaundry: true,
      hasParking: true,
      petFriendly: true,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.selectedTransitModes).toEqual(["driving", "walking"]);
      expect(result.data.minBedrooms).toBe(1);
      expect(result.data.maxBedrooms).toBe(2);
      expect(result.data.minBathrooms).toBe(1.5);
      expect(result.data.minSquareFeet).toBe(500);
      expect(result.data.maxSquareFeet).toBe(1200);
      expect(result.data.hasGym).toBe(true);
      expect(result.data.hasPool).toBe(false);
      expect(result.data.hasLaundry).toBe(true);
      expect(result.data.hasParking).toBe(true);
      expect(result.data.petFriendly).toBe(true);
    }
  });

  it("rejects invalid transit modes in selectedTransitModes", () => {
    const result = validateUpdatePreferencesInput({
      ...validPayload,
      selectedTransitModes: ["driving", "rocket"],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("selectedTransitModes must be an array of valid transit modes"))).toBe(true);
    }
  });
});

