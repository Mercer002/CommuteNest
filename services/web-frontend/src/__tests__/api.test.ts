import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchHealth, fetchUserPreferences, saveUserPreferences } from "../api.js";

describe("Web Frontend API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches health successfully", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { status: "healthy", service: "commutenest-preferences-api", timestamp: "2026-09-13T12:00:00.000Z" },
      }),
    });

    const health = await fetchHealth();
    expect(health.status).toBe("healthy");
  });

  it("fetches user preferences", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          userId: "mercer",
          maxRentUsd: 1800,
          maxCommuteMinutes: 35,
          targetDestination: "Union Station, Toronto, ON",
          transitMode: "transit",
          transitModes: ["bus", "subway"],
        },
      }),
    });

    const prefs = await fetchUserPreferences("mercer");
    expect(prefs?.userId).toBe("mercer");
    expect(prefs?.maxRentUsd).toBe(1800);
  });

  it("returns null when preferences are not found (404)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: "Not found" }),
    });

    const prefs = await fetchUserPreferences("nonexistent");
    expect(prefs).toBeNull();
  });

  it("saves user preferences via PUT", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          userId: "mercer",
          maxRentUsd: 1700,
          maxCommuteMinutes: 25,
          targetDestination: "Financial District",
          transitMode: "transit",
          transitModes: ["subway"],
        },
      }),
    });

    const saved = await saveUserPreferences("mercer", {
      maxRentUsd: 1700,
      maxCommuteMinutes: 25,
      targetDestination: "Financial District",
      transitMode: "transit",
      transitModes: ["subway"],
    });

    expect(saved.userId).toBe("mercer");
    expect(saved.maxRentUsd).toBe(1700);
  });
});

