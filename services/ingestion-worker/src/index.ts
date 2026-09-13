import "dotenv/config";
import { SnsAlertSink } from "./alerts/snsAlertSink.js";
import { LocalAlertSink } from "./alerts/localAlertSink.js";
import { GoogleDistanceMatrixClient, MockDistanceMatrixClient } from "./clients/distanceMatrixClient.js";
import { loadConfig, type AppConfig } from "./config.js";
import { runIngestionPipeline } from "./pipeline.js";
import { RssListingScraper } from "./scraper/rssListingScraper.js";
import { DynamoDbSeenListingsStore } from "./state/dynamoDbSeenListingsStore.js";
import { LocalSeenListingsStore } from "./state/localSeenListingsStore.js";
import type { AlertSink, DistanceClient, SeenListingsStore } from "./types.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const scraper = new RssListingScraper(config.listingSourceUrl, config.userAgent);
  const distanceClient = createDistanceClient(config);
  const seenListingsStore = createSeenListingsStore(config);
  const alertSink = createAlertSink(config);

  const summary = await runIngestionPipeline({
    scraper,
    distanceClient,
    seenListingsStore,
    alertSink,
    preferences: config.preferences,
  });

  console.log(
    JSON.stringify(
      {
        phase: "phase-3-serverless-backend",
        source: config.listingSourceUrl,
        distanceProvider: config.distanceProvider,
        stateStoreType: config.stateStoreType,
        alertSinkType: config.alertSinkType,
        preferences: config.preferences,
        summary,
      },
      null,
      2,
    ),
  );
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
