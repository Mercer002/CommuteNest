export type TransitMode = "transit" | "driving" | "walking" | "bicycling";

export interface MatchedListing {
  id: string;
  title: string;
  priceUsd: number;
  address: string;
  url: string;
  commuteMinutes: number;
  commuteSummary: string;
  matchedAt: string;
}

export interface UserPreferences {
  userId: string;
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes: string[];
  notificationEmail?: string;
  recentMatches?: MatchedListing[];
  lastScanAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

