import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchHealth, fetchUserPreferences, saveUserPreferences, sendDealsEmail, triggerScan } from "../api.js";

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

  it("triggers scan via POST /scan", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          matches: [
            {
              id: "listing-1",
              title: "Modern 1BR",
              priceUsd: 1650,
              address: "100 King St W",
              url: "https://example.com",
              commuteMinutes: 12,
              commuteSummary: "12 min to Union Station",
              matchedAt: "2026-09-13T12:00:00.000Z",
            },
          ],
          count: 1,
          scannedAt: "2026-09-13T12:00:00.000Z",
        },
      }),
    });

    const result = await triggerScan("mercer", { maxRentUsd: 1800 });
    expect(result.count).toBe(1);
    expect(result.matches[0].title).toBe("Modern 1BR");
  });

  it("calls sendDealsEmail via POST /email-deals", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          sent: true,
          dealsCount: 2,
          deals: [],
          message: "Sent 2 top deal(s) to your verified email!",
        },
      }),
    });

    const result = await sendDealsEmail("mercer");
    expect(result.sent).toBe(true);
    expect(result.dealsCount).toBe(2);
    expect(result.message).toContain("Sent 2 top deal(s)");
  });
});

