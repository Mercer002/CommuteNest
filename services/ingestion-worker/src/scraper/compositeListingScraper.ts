import type { Listing, ListingScraper } from "../types.js";

export class CompositeListingScraper implements ListingScraper {
  constructor(private readonly scrapers: ListingScraper[]) { }

  async scrape(): Promise<Listing[]> {
    const results = await Promise.allSettled(
      this.scrapers.map((scraper) => scraper.scrape()),
    );

    const allListings: Listing[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const listing of result.value) {
          if (!seenUrls.has(listing.url)) {
            seenUrls.add(listing.url);
            allListings.push(listing);
          }
        }
      } else {
        console.warn("Sub-scraper failed during composite aggregation:", result.reason);
      }
    }

    return allListings;
  }
}

