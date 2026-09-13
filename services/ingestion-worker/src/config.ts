import path from "node:path";
import process from "node:process";
import type { DistanceProvider, ListingSourceKind, TransitMode, UserPreferences } from "./types.js";

export type StateStoreType = "local" | "dynamodb";
export type AlertSinkType = "local" | "sns";

export interface AppConfig {
  listingSourceKind: ListingSourceKind;
  listingSourceUrl: string;
  distanceProvider: DistanceProvider;
  googleMapsApiKey?: string;
  googleDepartureTime: string;
  preferences: UserPreferences;
  stateStoreType: StateStoreType;
  seenListingsFile: string;
  seenListingsTableName?: string;
  seenListingsTtlDays: number;
  userPreferencesTableName?: string;
  activeUserId?: string;
  alertSinkType: AlertSinkType;
  alertsTopicArn?: string;
  dryRunAlerts: boolean;
  userAgent: string;
}

const DEFAULT_FIXTURE_PATH = path.resolve(process.cwd(), "fixtures/sample-listings.rss");

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isLambda = Boolean(env.AWS_LAMBDA_FUNCTION_NAME);
  const distanceProvider = parseDistanceProvider(
    env.DISTANCE_PROVIDER ?? (env.GOOGLE_MAPS_API_KEY ? "google" : "mock"),
  );
  const googleMapsApiKey = blankToUndefined(env.GOOGLE_MAPS_API_KEY);

  if (distanceProvider === "google" && !googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is required when DISTANCE_PROVIDER=google.");
  }

  const stateStoreType = parseStateStoreType(
    env.STATE_STORE_TYPE ?? (isLambda || env.SEEN_LISTINGS_TABLE_NAME ? "dynamodb" : "local"),
  );
  const seenListingsTableName = blankToUndefined(env.SEEN_LISTINGS_TABLE_NAME);

  if (stateStoreType === "dynamodb" && !seenListingsTableName) {
    throw new Error("SEEN_LISTINGS_TABLE_NAME is required when STATE_STORE_TYPE=dynamodb.");
  }

  const alertSinkType = parseAlertSinkType(
    env.ALERT_SINK_TYPE ?? (isLambda || env.ALERTS_TOPIC_ARN ? "sns" : "local"),
  );
  const alertsTopicArn = blankToUndefined(env.ALERTS_TOPIC_ARN);

  if (alertSinkType === "sns" && !alertsTopicArn) {
    throw new Error("ALERTS_TOPIC_ARN is required when ALERT_SINK_TYPE=sns.");
  }

  return {
    listingSourceKind: parseListingSourceKind(env.LISTING_SOURCE_KIND ?? "rss"),
    listingSourceUrl: env.LISTING_SOURCE_URL ?? DEFAULT_FIXTURE_PATH,
    distanceProvider,
    googleMapsApiKey,
    googleDepartureTime: env.GOOGLE_DEPARTURE_TIME ?? "now",
    preferences: {
      maxRentUsd: parsePositiveInteger(env.MAX_RENT_USD ?? "1800", "MAX_RENT_USD"),
      maxCommuteMinutes: parsePositiveInteger(env.MAX_COMMUTE_MINUTES ?? "35", "MAX_COMMUTE_MINUTES"),
      targetDestination: requireValue(env.TARGET_DESTINATION ?? "Union Station, Toronto, ON", "TARGET_DESTINATION"),
      transitMode: parseTransitMode(env.TRANSIT_MODE ?? "transit"),
      transitModes: parseCsv(env.TRANSIT_MODES ?? "bus,subway,train"),
    },
    stateStoreType,
    seenListingsFile: env.SEEN_LISTINGS_FILE ?? path.resolve(process.cwd(), ".local/seen-listings.json"),
    seenListingsTableName,
    seenListingsTtlDays: parsePositiveInteger(env.SEEN_LISTINGS_TTL_DAYS ?? "30", "SEEN_LISTINGS_TTL_DAYS"),
    userPreferencesTableName: blankToUndefined(env.USER_PREFERENCES_TABLE_NAME),
    activeUserId: blankToUndefined(env.ACTIVE_USER_ID ?? env.USER_ID),
    alertSinkType,
    alertsTopicArn,
    dryRunAlerts: parseBoolean(env.DRY_RUN_ALERTS ?? "true", "DRY_RUN_ALERTS"),
    userAgent: env.HTTP_USER_AGENT ?? "CommuteNestPhase1/0.1 (+https://github.com/local/commute-nest)",
  };
}

function parseDistanceProvider(value: string): DistanceProvider {
  if (value === "google" || value === "mock") {
    return value;
  }

  throw new Error("DISTANCE_PROVIDER must be either 'google' or 'mock'.");
}

function parseListingSourceKind(value: string): ListingSourceKind {
  if (value === "rss") {
    return value;
  }

  throw new Error("LISTING_SOURCE_KIND must be 'rss' for Phase 1.");
}

function parseStateStoreType(value: string): StateStoreType {
  if (value === "local" || value === "dynamodb") {
    return value;
  }

  throw new Error("STATE_STORE_TYPE must be either 'local' or 'dynamodb'.");
}

function parseAlertSinkType(value: string): AlertSinkType {
  if (value === "local" || value === "sns") {
    return value;
  }

  throw new Error("ALERT_SINK_TYPE must be either 'local' or 'sns'.");
}

function parseTransitMode(value: string): TransitMode {
  if (value === "transit" || value === "driving" || value === "walking" || value === "bicycling") {
    return value;
  }

  throw new Error("TRANSIT_MODE must be one of transit, driving, walking, or bicycling.");
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseBoolean(value: string, name: string): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be 'true' or 'false'.`);
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function requireValue(value: string, name: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${name} is required.`);
  }

  return trimmed;
}

function blankToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
