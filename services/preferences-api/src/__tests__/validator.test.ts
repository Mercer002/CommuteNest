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
});

