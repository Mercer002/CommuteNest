import { describe, expect, it, vi } from "vitest";
import { PreferencesRepository } from "../repository.js";

describe("PreferencesRepository", () => {
  it("throws if tableName is missing", () => {
    expect(() => new PreferencesRepository({ tableName: "" })).toThrow(
      "PreferencesRepository requires a tableName.",
    );
  });

  it("retrieves preferences for existing user", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({
      Item: {
        user_id: "user-1",
        max_rent_usd: 1700,
        max_commute_minutes: 30,
        target_destination: "Downtown Toronto",
        transit_mode: "transit",
        transit_modes: ["bus", "subway"],
        created_at: "2026-09-13T12:00:00.000Z",
        updated_at: "2026-09-13T12:00:00.000Z",
      },
    });
    const repo = new PreferencesRepository({
      tableName: "test-preferences",
      docClient: { send: mockSend },
    });

    const result = await repo.getPreferences("user-1");
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-1");
    expect(result?.maxRentUsd).toBe(1700);
    expect(result?.targetDestination).toBe("Downtown Toronto");
  });

  it("returns null for non-existent user", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({});
    const repo = new PreferencesRepository({
      tableName: "test-preferences",
      docClient: { send: mockSend },
    });

    const result = await repo.getPreferences("unknown-user");
    expect(result).toBeNull();
  });

  it("upserts user preferences to DynamoDB", async () => {
    // getPreferences check returns null (new record)
    const mockSend = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const repo = new PreferencesRepository({
      tableName: "test-preferences",
      docClient: { send: mockSend },
    });

    const saved = await repo.upsertPreferences("user-new", {
      maxRentUsd: 1900,
      maxCommuteMinutes: 40,
      targetDestination: "100 King St W, Toronto, ON",
      transitMode: "transit",
      transitModes: ["subway"],
    });

    expect(saved.userId).toBe("user-new");
    expect(saved.maxRentUsd).toBe(1900);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const putCall = mockSend.mock.calls[1][0];
    expect(putCall.input.TableName).toBe("test-preferences");
    expect(putCall.input.Item.user_id).toBe("user-new");
    expect(putCall.input.Item.max_rent_usd).toBe(1900);
  });
});

