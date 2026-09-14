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

  it("extracts bedrooms, bathrooms, sqft, and amenities from text", () => {
    const listing = normalizeRawListing({
      sourceName: "test-feed",
      externalId: "lux-123",
      title: "$2,200 Luxury 2 Bedroom 1.5 Bath Condo with Balcony",
      url: "https://example.test/lux-123",
      description: "Address: 200 Bay Street, Toronto, ON. 850 sq ft suite with gym, pool, washer/dryer in-unit, parking spot, and air conditioning. All inclusive utilities.",
    });

    expect(listing?.bedrooms).toBe(2);
    expect(listing?.bathrooms).toBe(1.5);
    expect(listing?.squareFeet).toBe(850);
    expect(listing?.amenities).toMatchObject({
      gym: true,
      pool: true,
      laundry: true,
      parking: true,
      airConditioning: true,
      balcony: true,
      utilitiesIncluded: true,
    });
  });

  it("handles studio apartments as 0 bedrooms", () => {
    const listing = normalizeRawListing({
      sourceName: "test-feed",
      externalId: "studio-99",
      title: "$1,400 Modern Studio Apartment",
      url: "https://example.test/studio-99",
      description: "Address: 50 Spadina Ave, Toronto, ON. 450 sqft bachelor suite, pet friendly.",
    });

    expect(listing?.bedrooms).toBe(0);
    expect(listing?.squareFeet).toBe(450);
    expect(listing?.amenities?.petFriendly).toBe(true);
  });
});

