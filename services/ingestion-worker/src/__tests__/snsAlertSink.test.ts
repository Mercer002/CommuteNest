import type { SNSClient } from "@aws-sdk/client-sns";
import { describe, expect, it, vi } from "vitest";
import { SnsAlertSink } from "../alerts/snsAlertSink.js";
import type { MatchedListing } from "../types.js";

const sampleMatch: MatchedListing = {
  listing: {
    id: "listing-test-1",
    sourceName: "toronto-rss",
    title: "Sunny 1BR condo downtown",
    url: "https://housing.example/listing/1",
    address: "200 Bay St, Toronto, ON",
    priceUsd: 1750,
  },
  commute: {
    originAddress: "200 Bay St, Toronto, ON",
    destinationAddress: "Union Station, Toronto, ON",
    durationSeconds: 12 * 60,
    durationMinutes: 12,
    distanceMeters: 850,
    distanceText: "0.85 km",
    provider: "mock",
  },
};

describe("SnsAlertSink", () => {
  it("throws if topicArn is not provided", () => {
    expect(() => new SnsAlertSink({ topicArn: "" })).toThrow("SnsAlertSink requires a topicArn.");
  });

  it("publishes formatted message and subject to SNS", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({ MessageId: "msg-123" });
    const mockClient = { send: mockSend } as unknown as SNSClient;

    const sink = new SnsAlertSink({
      topicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
      client: mockClient,
    });

    await sink.sendMatchAlert(sampleMatch);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.input.TopicArn).toBe("arn:aws:sns:us-east-1:123456789012:test-topic");
    expect(callArg.input.Subject).toContain("$1750/mo - 12m commute");
    expect(callArg.input.Subject.length).toBeLessThanOrEqual(100);
    expect(callArg.input.Message).toContain("Sunny 1BR condo downtown");
    expect(callArg.input.Message).toContain("Rent: $1750/month");
    expect(callArg.input.Message).toContain("Commute: 12 minutes");
    expect(callArg.input.Message).toContain("https://housing.example/listing/1");
  });
});

