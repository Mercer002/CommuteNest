export type ListingSourceKind = "rss";
export type DistanceProvider = "google" | "mock";
export type TransitMode = "transit" | "driving" | "walking" | "bicycling";

export interface UserPreferences {
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes: string[];
}

export interface RawListing {
  sourceName: string;
  externalId?: string;
  title: string;
  url: string;
  description?: string;
  publishedAt?: string;
  address?: string;
  priceUsd?: number;
}

export interface Listing {
  id: string;
  sourceName: string;
  title: string;
  url: string;
  description?: string;
  publishedAt?: string;
  address: string;
  priceUsd: number;
}

export interface CommuteOptions {
  mode: TransitMode;
  transitModes: string[];
}

export interface CommuteResult {
  originAddress: string;
  destinationAddress: string;
  durationSeconds: number;
  durationMinutes: number;
  distanceMeters?: number;
  distanceText?: string;
  provider: DistanceProvider;
}

export interface MatchedListing {
  listing: Listing;
  commute: CommuteResult;
}

export interface ListingScraper {
  scrape(): Promise<Listing[]>;
}

export interface DistanceClient {
  getCommute(origin: string, destination: string, options: CommuteOptions): Promise<CommuteResult>;
}

export interface SeenListingsStore {
  load(): Promise<void>;
  has(listingId: string): Promise<boolean>;
  markSeen(listingId: string): Promise<void>;
}

export interface AlertSink {
  sendMatchAlert(match: MatchedListing): Promise<void>;
}

export interface PipelineSummary {
  scraped: number;
  skippedSeen: number;
  skippedOverBudget: number;
  skippedCommute: number;
  alerted: number;
  errors: Array<{ listingId: string; message: string }>;
}
