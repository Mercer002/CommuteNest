import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { SeenListingsStore } from "../types.js";

export interface DynamoDbDocClientLike {
  send(command: any): Promise<any>;
}

export interface DynamoDbSeenListingsStoreOptions {
  tableName: string;
  client?: DynamoDBClient;
  docClient?: DynamoDbDocClientLike;
  ttlDays?: number;
  ttlAttributeName?: string;
}

export class DynamoDbSeenListingsStore implements SeenListingsStore {
  private readonly tableName: string;
  private readonly docClient: DynamoDbDocClientLike;
  private readonly ttlDays: number;
  private readonly ttlAttributeName: string;

  constructor(options: DynamoDbSeenListingsStoreOptions) {
    if (!options.tableName) {
      throw new Error("DynamoDbSeenListingsStore requires a tableName.");
    }

    this.tableName = options.tableName;
    this.ttlDays = options.ttlDays ?? 30;
    this.ttlAttributeName = options.ttlAttributeName ?? "expires_at";

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

  async load(): Promise<void> {
    // DynamoDB is queried on-demand per listing; no upfront bulk load required.
  }

  async has(listingId: string): Promise<boolean> {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          listing_id: listingId,
        },
        ProjectionExpression: "listing_id",
      }),
    );

    return Boolean(response.Item);
  }

  async markSeen(listingId: string): Promise<void> {
    const now = new Date();
    const expiresAt = Math.floor(now.getTime() / 1000) + this.ttlDays * 86400;

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          listing_id: listingId,
          seen_at: now.toISOString(),
          [this.ttlAttributeName]: expiresAt,
        },
      }),
    );
  }
}

