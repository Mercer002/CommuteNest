import { describe, expect, it } from "vitest";
import { extractAddress, normalizeRawListing, parseRentUsd } from "../scraper/listingNormalizer.js";

describe("listing normalizer", () => {
  it("extracts monthly rent without confusing it for a deposit", () => {
    expect(parseRentUsd("Studio for $1,750 per month, deposit $500")).toBe(1750);
  });

  it("extracts an address from common listing text", () => {
    expect(extractAddress("Address: 100 King Street West, Toronto, ON. Close to transit.")).toBe(
      "100 King Street West, Toronto, ON",
    );
  });

  it("normalizes a raw listing with stable required fields", () => {
    const listing = normalizeRawListing({
      sourceName: "test-feed",
      externalId: "abc-123",
      title: "$1,650 bright studio",
      url: "https://example.test/abc-123",
      description: "Address: 100 King Street West, Toronto, ON.",
    });

    expect(listing).toMatchObject({
      sourceName: "test-feed",
      priceUsd: 1650,
      address: "100 King Street West, Toronto, ON",
    });
    expect(listing?.id).toHaveLength(24);
  });
});
