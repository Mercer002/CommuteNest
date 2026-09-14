export type TransitMode = "transit" | "driving" | "walking" | "bicycling";

export interface ListingAmenities {
  gym?: boolean;
  pool?: boolean;
  laundry?: boolean;
  utilitiesIncluded?: boolean;
  parking?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;
  airConditioning?: boolean;
  balcony?: boolean;
}

export interface MatchedListing {
  id: string;
  sourceName?: string;
  title: string;
  priceUsd: number;
  address: string;
  url: string;
  commuteMinutes: number;
  commuteSummary: string;
  commuteBreakdown?: Record<string, number>;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  amenities?: ListingAmenities;
  isGoodDeal?: boolean;
  dealReason?: string;
  matchedAt: string;
}

export interface UserPreferences {
  userId: string;
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes: string[];
  selectedTransitModes?: TransitMode[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  hasGym?: boolean;
  hasPool?: boolean;
  hasLaundry?: boolean;
  utilitiesIncluded?: boolean;
  hasParking?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;
  airConditioning?: boolean;
  hasBalcony?: boolean;
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

