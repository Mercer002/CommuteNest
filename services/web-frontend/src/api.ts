import type { ApiResponse, MatchedListing, UserPreferences } from "./types.js";

const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || "https://ikssv62lcj.execute-api.us-east-1.amazonaws.com";
export const API_BASE_URL = RAW_API_URL.endsWith("/") ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

export async function fetchHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }
  const json: ApiResponse<{ status: string; service: string; timestamp: string }> = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || "Invalid response from health check endpoint");
  }
  return json.data;
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const response = await fetch(`${API_BASE_URL}/preferences/${encodeURIComponent(userId)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const errorJson: ApiResponse = await response.json().catch(() => ({ success: false, error: "Network error" }));
    throw new Error(errorJson.error || `Failed to fetch preferences (HTTP ${response.status})`);
  }
  const json: ApiResponse<UserPreferences> = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to parse user preferences");
  }
  return json.data;
}

export async function saveUserPreferences(
  userId: string,
  preferences: Omit<UserPreferences, "userId" | "createdAt" | "updatedAt">,
): Promise<UserPreferences> {
  const response = await fetch(`${API_BASE_URL}/preferences/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  const json: ApiResponse<UserPreferences> = await response.json().catch(() => ({
    success: false,
    error: "Malformed response from server",
  }));

  if (!response.ok || !json.success || !json.data) {
    const errorMsg = json.errors?.join(", ") || json.error || `Failed to save preferences (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export async function triggerScan(
  userId: string,
  overrides?: Partial<UserPreferences>,
): Promise<{ matches: MatchedListing[]; count: number; scannedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/preferences/${encodeURIComponent(userId)}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: overrides ? JSON.stringify(overrides) : "{}",
  });

  if (!response.ok) {
    const errorJson: ApiResponse = await response.json().catch(() => ({ success: false, error: "Scan request failed" }));
    throw new Error(errorJson.error || `Scan failed with HTTP ${response.status}`);
  }

  const json: ApiResponse<{ matches: MatchedListing[]; count: number; scannedAt: string }> = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to parse scan response");
  }

  return json.data;
}

export async function sendDealsEmail(
  userId: string,
): Promise<{ sent: boolean; dealsCount: number; deals: MatchedListing[]; message: string }> {
  const response = await fetch(`${API_BASE_URL}/preferences/${encodeURIComponent(userId)}/email-deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorJson: ApiResponse = await response.json().catch(() => ({ success: false, error: "Email deals request failed" }));
    throw new Error(errorJson.error || `Email request failed with HTTP ${response.status}`);
  }

  const json: ApiResponse<{ sent: boolean; dealsCount: number; deals: MatchedListing[]; message: string }> = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to parse email deals response");
  }

  return json.data;
}

