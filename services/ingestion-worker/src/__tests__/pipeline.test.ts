import { describe, expect, it, vi } from "vitest";
import { runIngestionPipeline } from "../pipeline.js";
import type {
  AlertSink,
  CommuteResult,
  DistanceClient,
  Listing,
  ListingScraper,
  SeenListingsStore,
  UserPreferences,
} from "../types.js";

describe("runIngestionPipeline", () => {
  const preferences: UserPreferences = {
    maxRentUsd: 1800,
    maxCommuteMinutes: 30,
    targetDestination: "Union Station, Toronto, ON",
    transitMode: "transit",
    transitModes: ["subway"],
  };

  const goodDealListing: Listing = {
    id: "deal-1",
    sourceName: "test",
    title: "Cheap Studio Downtown",
    priceUsd: 1500, // $300 savings -> Good deal!
    address: "100 King St W, Toronto, ON",
    url: "https://example.com/1",
  };

  const normalMatchListing: Listing = {
    id: "normal-1",
    sourceName: "test",
    title: "Standard Apartment",
    priceUsd: 1750, // $50 savings (< $100)
    address: "200 Queen St W, Toronto, ON",
    url: "https://example.com/2",
  };

  const commuteDeal: CommuteResult = {
    originAddress: goodDealListing.address,
    destinationAddress: preferences.targetDestination,
    durationSeconds: 15 * 60,
    durationMinutes: 15,
    provider: "mock",
  };

  const commuteNormal: CommuteResult = {
    originAddress: normalMatchListing.address,
    destinationAddress: preferences.targetDestination,
    durationSeconds: 28 * 60, // 28 min (> 22.5 min = 75%)
    durationMinutes: 28,
    provider: "mock",
  };

  it("only sends email alerts for good deals while recording all matches", async () => {
    const scraper: ListingScraper = {
      scrape: vi.fn().mockResolvedValue([goodDealListing, normalMatchListing]),
    };

    const distanceClient: DistanceClient = {
      getCommute: vi.fn().mockImplementation((origin: string) => {
        if (origin === goodDealListing.address) return Promise.resolve(commuteDeal);
        return Promise.resolve(commuteNormal);
      }),
    };

    const seenStore: SeenListingsStore = {
      load: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
      markSeen: vi.fn().mockResolvedValue(undefined),
    };

    const alertSink: AlertSink = {
      sendMatchAlert: vi.fn().mockResolvedValue(undefined),
    };

    const result = await runIngestionPipeline({
      scraper,
      distanceClient,
      seenListingsStore: seenStore,
      alertSink,
      preferences,
    });

    expect(result.scraped).toBe(2);
    // Both matched criteria
    expect(result.matches).toHaveLength(2);
    // But only 1 good deal alerted via email
    expect(result.alerted).toBe(1);
    expect(alertSink.sendMatchAlert).toHaveBeenCalledTimes(1);
    expect(alertSink.sendMatchAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: goodDealListing,
        isGoodDeal: true,
      }),
    );
    // Both are marked seen in store
    expect(seenStore.markSeen).toHaveBeenCalledWith("deal-1");
    expect(seenStore.markSeen).toHaveBeenCalledWith("normal-1");
  });
});

