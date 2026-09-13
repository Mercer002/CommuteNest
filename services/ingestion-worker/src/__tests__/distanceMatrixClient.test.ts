import { describe, expect, it } from "vitest";
import { GoogleDistanceMatrixClient, MockDistanceMatrixClient } from "../clients/distanceMatrixClient.js";

describe("distance matrix clients", () => {
  it("returns deterministic mock commute times for fixture addresses", async () => {
    const client = new MockDistanceMatrixClient();
    const result = await client.getCommute("100 King Street West, Toronto, ON", "Union Station, Toronto, ON", {
      mode: "transit",
      transitModes: ["subway"],
    });

    expect(result.durationMinutes).toBe(18);
    expect(result.provider).toBe("mock");
  });

  it("maps Google Distance Matrix responses into commute results", async () => {
    const fetchImpl = async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("mode")).toBe("transit");
      expect(url.searchParams.get("transit_mode")).toBe("bus|subway");

      return new Response(
        JSON.stringify({
          status: "OK",
          origin_addresses: ["100 King St W, Toronto, ON, Canada"],
          destination_addresses: ["Union Station, Toronto, ON, Canada"],
          rows: [
            {
              elements: [
                {
                  status: "OK",
                  duration: { text: "21 mins", value: 1260 },
                  distance: { text: "3.2 km", value: 3200 },
                },
              ],
            },
          ],
        }),
        { status: 200 },
      );
    };

    const client = new GoogleDistanceMatrixClient("fake-key", "now", fetchImpl);
    const result = await client.getCommute("100 King Street West, Toronto, ON", "Union Station, Toronto, ON", {
      mode: "transit",
      transitModes: ["bus", "subway"],
    });

    expect(result).toMatchObject({
      durationMinutes: 21,
      distanceMeters: 3200,
      provider: "google",
    });
  });
});
