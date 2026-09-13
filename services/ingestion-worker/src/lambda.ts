import { SnsAlertSink } from "./alerts/snsAlertSink.js";
import { LocalAlertSink } from "./alerts/localAlertSink.js";
import { GoogleDistanceMatrixClient, MockDistanceMatrixClient } from "./clients/distanceMatrixClient.js";
import { loadConfig, type AppConfig } from "./config.js";
import { runIngestionPipeline } from "./pipeline.js";
import { RssListingScraper } from "./scraper/rssListingScraper.js";
import { DynamoDbPreferencesStore } from "./state/dynamoDbPreferencesStore.js";
import { DynamoDbSeenListingsStore } from "./state/dynamoDbSeenListingsStore.js";
import { LocalSeenListingsStore } from "./state/localSeenListingsStore.js";
import type { AlertSink, DistanceClient, PipelineSummary, SeenListingsStore, UserPreferences } from "./types.js";

export interface LambdaResult {
  statusCode: number;
  summary: PipelineSummary;
}

export async function handler(event: unknown = {}): Promise<LambdaResult> {
  console.log("CommuteNest scheduled ingestion Lambda triggered. Event:", JSON.stringify(event));

  const config = loadConfig();

  const scraper = new RssListingScraper(config.listingSourceUrl, config.userAgent);
  const distanceClient = createDistanceClient(config);
  const seenListingsStore = createSeenListingsStore(config);
  const alertSink = createAlertSink(config);
  const preferences = await resolvePreferences(config);

  const summary = await runIngestionPipeline({
    scraper,
    distanceClient,
    seenListingsStore,
    alertSink,
    preferences,
  });

  console.log("CommuteNest ingestion completed. Summary:", JSON.stringify(summary));

  if (config.userPreferencesTableName && config.activeUserId && summary.matches && summary.matches.length > 0) {
    try {
      const preferencesStore = new DynamoDbPreferencesStore({
        tableName: config.userPreferencesTableName,
      });
      await preferencesStore.saveRecentMatches(config.activeUserId, summary.matches);
      console.log(`Saved ${summary.matches.length} recent match(es) to user '${config.activeUserId}' in DynamoDB.`);
    } catch (err) {
      console.warn(`Failed to save recent matches to DynamoDB: ${err instanceof Error ? err.message : err}`);
    }
  }

  return {
    statusCode: 200,
    summary,
  };
}

async function resolvePreferences(config: AppConfig): Promise<UserPreferences> {
  if (config.userPreferencesTableName && config.activeUserId) {
    try {
      const preferencesStore = new DynamoDbPreferencesStore({
        tableName: config.userPreferencesTableName,
      });
      const livePreferences = await preferencesStore.loadUserPreferences(config.activeUserId);
      if (livePreferences) {
        console.log(`Loaded live preferences from DynamoDB for user '${config.activeUserId}':`, JSON.stringify(livePreferences));
        return livePreferences;
      }
      console.log(`No preferences record found in DynamoDB for user '${config.activeUserId}'. Falling back to defaults.`);
    } catch (error) {
      console.warn(`Failed to fetch user preferences from DynamoDB: ${error instanceof Error ? error.message : error}. Using defaults.`);
    }
  }

  return config.preferences;
}

function createDistanceClient(config: AppConfig): DistanceClient {
  if (config.distanceProvider === "google") {
    return new GoogleDistanceMatrixClient(config.googleMapsApiKey!, config.googleDepartureTime);
  }

  return new MockDistanceMatrixClient();
}

function createSeenListingsStore(config: AppConfig): SeenListingsStore {
  if (config.stateStoreType === "dynamodb") {
    return new DynamoDbSeenListingsStore({
      tableName: config.seenListingsTableName!,
      ttlDays: config.seenListingsTtlDays,
    });
  }

  return new LocalSeenListingsStore(config.seenListingsFile);
}

function createAlertSink(config: AppConfig): AlertSink {
  if (config.alertSinkType === "sns") {
    return new SnsAlertSink({
      topicArn: config.alertsTopicArn!,
    });
  }

  return new LocalAlertSink(config.dryRunAlerts);
}

