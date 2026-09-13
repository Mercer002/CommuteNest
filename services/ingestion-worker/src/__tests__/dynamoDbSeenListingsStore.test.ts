import { describe, expect, it, vi } from "vitest";
import { DynamoDbSeenListingsStore } from "../state/dynamoDbSeenListingsStore.js";

describe("DynamoDbSeenListingsStore", () => {
  it("throws if tableName is not provided", () => {
    expect(() => new DynamoDbSeenListingsStore({ tableName: "" })).toThrow(
      "DynamoDbSeenListingsStore requires a tableName.",
    );
  });

  it("returns true from has() when item exists in DynamoDB", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({
      Item: { listing_id: "listing-123" },
    });
    const mockDocClient = { send: mockSend };

    const store = new DynamoDbSeenListingsStore({
      tableName: "test-seen-listings",
      docClient: mockDocClient,
    });

    const result = await store.has("listing-123");
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input).toEqual({
      TableName: "test-seen-listings",
      Key: { listing_id: "listing-123" },
      ProjectionExpression: "listing_id",
    });
  });

  it("returns false from has() when item does not exist", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({});
    const mockDocClient = { send: mockSend };

    const store = new DynamoDbSeenListingsStore({
      tableName: "test-seen-listings",
      docClient: mockDocClient,
    });

    const result = await store.has("unknown-listing");
    expect(result).toBe(false);
  });

  it("writes item with TTL to DynamoDB on markSeen()", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({});
    const mockDocClient = { send: mockSend };

    const store = new DynamoDbSeenListingsStore({
      tableName: "test-seen-listings",
      docClient: mockDocClient,
      ttlDays: 14,
    });

    await store.markSeen("listing-456");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.TableName).toBe("test-seen-listings");
    expect(callArg.input.Item.listing_id).toBe("listing-456");
    expect(typeof callArg.input.Item.seen_at).toBe("string");
    expect(typeof callArg.input.Item.expires_at).toBe("number");

    // Expiry should be roughly 14 days in seconds from now
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expectedExpiry = nowSeconds + 14 * 86400;
    expect(callArg.input.Item.expires_at).toBeGreaterThanOrEqual(expectedExpiry - 5);
    expect(callArg.input.Item.expires_at).toBeLessThanOrEqual(expectedExpiry + 5);
  });
});

