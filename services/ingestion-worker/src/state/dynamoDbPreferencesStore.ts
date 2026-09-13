import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { MatchedListing, UserPreferences } from "../types.js";

export interface DynamoDbPreferencesStoreOptions {
  tableName: string;
  client?: DynamoDBClient;
  docClient?: { send(command: any): Promise<any> };
}

export class DynamoDbPreferencesStore {
  private readonly tableName: string;
  private readonly docClient: { send(command: any): Promise<any> };

  constructor(options: DynamoDbPreferencesStoreOptions) {
    if (!options.tableName) {
      throw new Error("DynamoDbPreferencesStore requires a tableName.");
    }

    this.tableName = options.tableName;

    if (options.docClient) {
      this.docClient = options.docClient;
    } else {
      const baseClient = options.client ?? new DynamoDBClient({});
      this.docClient = DynamoDBDocumentClient.from(baseClient, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });
    }
  }

  async loadUserPreferences(userId: string): Promise<UserPreferences | null> {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          user_id: userId,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    const item = response.Item;
    return {
      maxRentUsd: Number(item.max_rent_usd),
      maxCommuteMinutes: Number(item.max_commute_minutes),
      targetDestination: String(item.target_destination),
      transitMode: item.transit_mode,
      transitModes: item.transit_modes ?? ["bus", "subway", "train"],
    };
  }

  async saveRecentMatches(userId: string, matches: MatchedListing[]): Promise<void> {
    const formattedMatches = matches.slice(0, 25).map((m) => ({
      id: m.listing.id,
      title: m.listing.title,
      priceUsd: m.listing.priceUsd,
      address: m.listing.address,
      url: m.listing.url,
      commuteMinutes: m.commute.durationMinutes,
      commuteSummary: m.commute.distanceText || `${m.commute.durationMinutes} mins`,
      matchedAt: new Date().toISOString(),
    }));

    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          user_id: userId,
        },
        UpdateExpression: "SET recent_matches = :matches, last_scan_at = :lastScanAt",
        ExpressionAttributeValues: {
          ":matches": formattedMatches,
          ":lastScanAt": new Date().toISOString(),
        },
      }),
    );
  }
}

