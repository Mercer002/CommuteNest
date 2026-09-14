import type {
  AlertSink,
  DistanceClient,
  ListingScraper,
  MatchedListing,
  PipelineSummary,
  SeenListingsStore,
  UserPreferences,
} from "./types.js";
import { evaluateListing, isWithinBudget } from "./filters/listingFilter.js";

export interface IngestionPipelineDependencies {
  scraper: ListingScraper;
  distanceClient: DistanceClient;
  seenListingsStore: SeenListingsStore;
  alertSink: AlertSink;
  preferences: UserPreferences;
}

export async function runIngestionPipeline({
  scraper,
  distanceClient,
  seenListingsStore,
  alertSink,
  preferences,
}: IngestionPipelineDependencies): Promise<PipelineSummary> {
  await seenListingsStore.load();

  const listings = await scraper.scrape();
  const matches: MatchedListing[] = [];
  const summary: PipelineSummary = {
    scraped: listings.length,
    skippedSeen: 0,
    skippedOverBudget: 0,
    skippedCommute: 0,
    alerted: 0,
    errors: [],
    matches,
  };

  for (const listing of listings) {
    if (await seenListingsStore.has(listing.id)) {
      summary.skippedSeen += 1;
      continue;
    }

    if (!isWithinBudget(listing, preferences)) {
      summary.skippedOverBudget += 1;
      await seenListingsStore.markSeen(listing.id);
      continue;
    }

    try {
      const commute = await distanceClient.getCommute(listing.address, preferences.targetDestination, {
        mode: preferences.transitMode,
        transitModes: preferences.transitModes,
      });
      const evaluation = evaluateListing(listing, commute, preferences);

      if (evaluation.matches) {
        const match: MatchedListing = {
          listing,
          commute,
          isGoodDeal: evaluation.isGoodDeal,
          dealReason: evaluation.dealReason,
        };
        matches.push(match);

        // Only send email alert for listings that are GOOD DEALS!
        if (evaluation.isGoodDeal) {
          await alertSink.sendMatchAlert(match);
          summary.alerted += 1;
        }
      } else {
        summary.skippedCommute += 1;
      }

      await seenListingsStore.markSeen(listing.id);
    } catch (error) {
      summary.errors.push({
        listingId: listing.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
