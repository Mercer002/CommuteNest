import type { CommuteOptions, CommuteResult, DistanceClient } from "../types.js";

type FetchLike = typeof fetch;

interface GoogleDistanceMatrixElement {
  status: string;
  duration?: {
    text: string;
    value: number;
  };
  distance?: {
    text: string;
    value: number;
  };
}

interface GoogleDistanceMatrixResponse {
  status: string;
  error_message?: string;
  origin_addresses?: string[];
  destination_addresses?: string[];
  rows?: Array<{
    elements?: GoogleDistanceMatrixElement[];
  }>;
}

export class GoogleDistanceMatrixClient implements DistanceClient {
  constructor(
    private readonly apiKey: string,
    private readonly departureTime = "now",
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async getCommute(origin: string, destination: string, options: CommuteOptions): Promise<CommuteResult> {
    const requestUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    requestUrl.searchParams.set("origins", origin);
    requestUrl.searchParams.set("destinations", destination);
    requestUrl.searchParams.set("mode", options.mode);
    requestUrl.searchParams.set("units", "imperial");
    requestUrl.searchParams.set("key", this.apiKey);

    if (options.mode === "transit") {
      requestUrl.searchParams.set("departure_time", this.departureTime);

      if (options.transitModes.length > 0) {
        requestUrl.searchParams.set("transit_mode", options.transitModes.join("|"));
      }
    }

    const response = await this.fetchImpl(requestUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Distance Matrix request failed with HTTP ${response.status} ${response.statusText}.`);
    }

    const payload = (await response.json()) as GoogleDistanceMatrixResponse;

    if (payload.status !== "OK") {
      throw new Error(`Google Distance Matrix status ${payload.status}: ${payload.error_message ?? "no details"}.`);
    }

    const element = payload.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK" || !element.duration) {
      throw new Error(`Google Distance Matrix element status ${element?.status ?? "MISSING"}.`);
    }

    return {
      originAddress: payload.origin_addresses?.[0] ?? origin,
      destinationAddress: payload.destination_addresses?.[0] ?? destination,
      durationSeconds: element.duration.value,
      durationMinutes: Math.ceil(element.duration.value / 60),
      distanceMeters: element.distance?.value,
      distanceText: element.distance?.text,
      provider: "google",
    };
  }
}

export class MockDistanceMatrixClient implements DistanceClient {
  async getCommute(origin: string, destination: string, _options?: CommuteOptions): Promise<CommuteResult> {
    const durationMinutes = mockDurationMinutes(origin);

    return {
      originAddress: origin,
      destinationAddress: destination,
      durationSeconds: durationMinutes * 60,
      durationMinutes,
      distanceMeters: durationMinutes * 420,
      distanceText: `${Math.max(1, Math.round(durationMinutes * 0.42))} km`,
      provider: "mock",
    };
  }
}

function mockDurationMinutes(origin: string): number {
  const lowerOrigin = origin.toLowerCase();
  const overrides = [
    { match: "king street", minutes: 18 },
    { match: "bloor street", minutes: 32 },
    { match: "borough drive", minutes: 52 },
    { match: "queens quay", minutes: 26 },
  ];

  const override = overrides.find((entry) => lowerOrigin.includes(entry.match));
  if (override) {
    return override.minutes;
  }

  const hash = Array.from(lowerOrigin).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return 20 + (hash % 40);
}
