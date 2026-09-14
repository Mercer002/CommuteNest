import { describe, expect, it } from "vitest";
import { CompositeListingScraper } from "../scraper/compositeListingScraper.js";
import type { Listing, ListingScraper } from "../types.js";

describe("CompositeListingScraper", () => {
  it("aggregates listings across multiple scrapers and deduplicates by URL", async () => {
    const listingA: Listing = {
      id: "a1",
      sourceName: "Craigslist",
      title: "Apartment A",
      url: "https://example.test/apt-a",
      address: "100 King St, Toronto, ON",
      priceUsd: 1500,
    };

    const listingB: Listing = {
      id: "b1",
      sourceName: "Kijiji",
      title: "Apartment B",
      url: "https://example.test/apt-b",
      address: "200 Queen St, Toronto, ON",
      priceUsd: 1600,
    };

    const duplicateListingA: Listing = {
      id: "a2",
      sourceName: "Syndication",
      title: "Apartment A Repost",
      url: "https://example.test/apt-a",
      address: "100 King St, Toronto, ON",
      priceUsd: 1500,
    };

    const scraper1: ListingScraper = {
      scrape: async () => [listingA],
    };

    const scraper2: ListingScraper = {
      scrape: async () => [listingB, duplicateListingA],
    };

    const composite = new CompositeListingScraper([scraper1, scraper2]);
    const results = await composite.scrape();

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.url)).toEqual([
      "https://example.test/apt-a",
      "https://example.test/apt-b",
    ]);
  });

  it("handles failing scrapers gracefully without aborting healthy ones", async () => {
    const listingHealthy: Listing = {
      id: "h1",
      sourceName: "Kijiji",
      title: "Healthy Listing",
      url: "https://example.test/healthy",
      address: "300 Bay St, Toronto, ON",
      priceUsd: 1700,
    };

    const healthyScraper: ListingScraper = {
      scrape: async () => [listingHealthy],
    };

    const faultyScraper: ListingScraper = {
      scrape: async () => {
        throw new Error("Network timeout");
      },
    };

    const composite = new CompositeListingScraper([faultyScraper, healthyScraper]);
    const results = await composite.scrape();

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Healthy Listing");
  });
});
