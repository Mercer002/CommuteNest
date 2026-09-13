import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { MatchedListingRecord, UpdatePreferencesInput, UserPreferencesRecord } from "./types.js";

export interface DynamoDbDocClientLike {
  send(command: any): Promise<any>;
}

export interface PreferencesRepositoryOptions {
  tableName: string;
  client?: DynamoDBClient;
  docClient?: DynamoDbDocClientLike;
}

export class PreferencesRepository {
  private readonly tableName: string;
  private readonly docClient: DynamoDbDocClientLike;

  constructor(options: PreferencesRepositoryOptions) {
    if (!options.tableName) {
      throw new Error("PreferencesRepository requires a tableName.");
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

  async getPreferences(userId: string): Promise<UserPreferencesRecord | null> {
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
      userId: item.user_id,
      maxRentUsd: item.max_rent_usd,
      maxCommuteMinutes: item.max_commute_minutes,
      targetDestination: item.target_destination,
      transitMode: item.transit_mode,
      transitModes: item.transit_modes ?? ["bus", "subway", "train"],
      notificationEmail: item.notification_email,
      recentMatches: item.recent_matches ?? [],
      lastScanAt: item.last_scan_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  async upsertPreferences(
    userId: string,
    input: UpdatePreferencesInput,
  ): Promise<UserPreferencesRecord> {
    const existing = await this.getPreferences(userId);
    const now = new Date().toISOString();

    const record: UserPreferencesRecord = {
      userId,
      maxRentUsd: input.maxRentUsd,
      maxCommuteMinutes: input.maxCommuteMinutes,
      targetDestination: input.targetDestination,
      transitMode: input.transitMode,
      transitModes: input.transitModes ?? ["bus", "subway", "train"],
      notificationEmail: input.notificationEmail,
      recentMatches: existing?.recentMatches ?? [],
      lastScanAt: existing?.lastScanAt,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          user_id: record.userId,
          max_rent_usd: record.maxRentUsd,
          max_commute_minutes: record.maxCommuteMinutes,
          target_destination: record.targetDestination,
          transit_mode: record.transitMode,
          transit_modes: record.transitModes,
          notification_email: record.notificationEmail,
          recent_matches: record.recentMatches,
          last_scan_at: record.lastScanAt,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        },
      }),
    );

    return record;
  }

  async saveRecentMatches(
    userId: string,
    matches: MatchedListingRecord[],
  ): Promise<MatchedListingRecord[]> {
    const now = new Date().toISOString();
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        UpdateExpression: "SET recent_matches = :matches, last_scan_at = :lastScanAt",
        ExpressionAttributeValues: {
          ":matches": matches,
          ":lastScanAt": now,
        },
      }),
    );
    return matches;
  }

  async deletePreferences(userId: string): Promise<boolean> {
    const existing = await this.getPreferences(userId);
    if (!existing) {
      return false;
    }

    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          user_id: userId,
        },
      }),
    );

    return true;
  }
}

