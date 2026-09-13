export type TransitMode = "transit" | "driving" | "walking" | "bicycling";

export interface UserPreferences {
  userId: string;
  maxRentUsd: number;
  maxCommuteMinutes: number;
  targetDestination: string;
  transitMode: TransitMode;
  transitModes: string[];
  notificationEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

