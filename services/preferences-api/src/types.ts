export type TransitMode = "transit" | "driving" | "walking" | "bicycling";

export interface MatchedListingRecord {
  id: string;
  title: string;
  priceUsd: number;
  address: string;
  url: string;
  commuteMinutes: number;
  commuteSummary: string;
  isGoodDeal?: boolean;
  dealReason?: string;
  matchedAt: string;
}

export interface UserPreferencesRecord {
  userId: string;
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes: string[];
  notificationEmail?: string;
  recentMatches?: MatchedListingRecord[];
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes?: string[];
  notificationEmail?: string;
}

export interface ValidationSuccess<T> {
  valid: true;
  data: T;
}

export interface ValidationFailure {
  valid: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

