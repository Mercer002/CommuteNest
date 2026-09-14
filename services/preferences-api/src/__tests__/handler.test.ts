import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler, setRepository, setSnsClient } from "../handler.js";
import { PreferencesRepository } from "../repository.js";

describe("API Gateway Handler", () => {
  const mockSend = vi.fn();
  const repo = new PreferencesRepository({
    tableName: "mock-table",
    docClient: { send: mockSend },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setRepository(repo);
  });

  function createEvent(
    method: string,
    rawPath: string,
    body?: Record<string, unknown>,
  ): APIGatewayProxyEventV2 {
    return {
      version: "2.0",
      routeKey: `${method} ${rawPath}`,
      rawPath,
      rawQueryString: "",
      headers: {
        "content-type": "application/json",
      },
      requestContext: {
        accountId: "123456789012",
        apiId: "test-api",
        domainName: "test.execute-api.us-east-1.amazonaws.com",
        domainPrefix: "test",
        http: {
          method,
          path: rawPath,
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "vitest",
        },
        requestId: "req-1",
        routeKey: `${method} ${rawPath}`,
        stage: "$default",
        time: "13/Sep/2026:12:00:00 +0000",
        timeEpoch: 1789300000000,
      },
      body: body ? JSON.stringify(body) : undefined,
      isBase64Encoded: false,
    };
  }

  it("handles OPTIONS preflight request with 204", async () => {
    const event = createEvent("OPTIONS", "/preferences/mercer");
    const response = (await handler(event)) as { statusCode: number; headers: Record<string, string> };

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("handles GET /health with 200", async () => {
    const event = createEvent("GET", "/health");
    const response = (await handler(event)) as { statusCode: number; body: string };

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("healthy");
  });

  it("handles GET /preferences/{userId} when record exists", async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        user_id: "mercer",
        max_rent_usd: 1800,
        max_commute_minutes: 35,
        target_destination: "Union Station, Toronto, ON",
        transit_mode: "transit",
        transit_modes: ["bus", "subway"],
        recent_matches: [
          {
            id: "listing-1",
            title: "Sunlit Studio",
            priceUsd: 1650,
            address: "100 King St W",
            url: "https://example.com/1",
            commuteMinutes: 12,
            commuteSummary: "12 min to Union Station",
            matchedAt: "2026-09-13T12:00:00.000Z",
          },
        ],
        created_at: "2026-09-13T12:00:00.000Z",
        updated_at: "2026-09-13T12:00:00.000Z",
      },
    });

    const event = createEvent("GET", "/preferences/mercer");
    const response = (await handler(event)) as { statusCode: number; body: string };

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe("mercer");
    expect(body.data.maxRentUsd).toBe(1800);
    expect(body.data.recentMatches.length).toBe(1);
    expect(body.data.recentMatches[0].title).toBe("Sunlit Studio");
  });

  it("handles POST /preferences/{userId}/scan to trigger on-demand matching", async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        user_id: "mercer",
        max_rent_usd: 2000,
        max_commute_minutes: 30,
        target_destination: "Union Station, Toronto, ON",
        transit_mode: "transit",
      },
    }).mockResolvedValueOnce({}); // saveRecentMatches

    const event = createEvent("POST", "/preferences/mercer/scan", {
      maxRentUsd: 1800,
      maxCommuteMinutes: 25,
    });

    const response = (await handler(event)) as { statusCode: number; body: string };
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.matches).toBeDefined();
    expect(body.data.count).toBeGreaterThan(0);
  });

  it("handles POST /preferences/{userId}/email-deals to dispatch email alerts", async () => {
    process.env.ALERTS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:test-alerts";
    const mockSnsSend = vi.fn().mockResolvedValueOnce({ MessageId: "msg-123" });
    setSnsClient({ send: mockSnsSend } as any);

    mockSend.mockResolvedValueOnce({
      Item: {
        user_id: "mercer",
        max_rent_usd: 2000,
        max_commute_minutes: 30,
        target_destination: "Union Station, Toronto, ON",
        transit_mode: "transit",
      },
    });

    const event = createEvent("POST", "/preferences/mercer/email-deals");
    const response = (await handler(event)) as { statusCode: number; body: string };
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.sent).toBe(true);
    expect(mockSnsSend).toHaveBeenCalled();
  });

  it("handles GET /preferences/{userId} when not found with 404", async () => {
    mockSend.mockResolvedValueOnce({});

    const event = createEvent("GET", "/preferences/unknown");
    const response = (await handler(event)) as { statusCode: number; body: string };

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain("not found");
  });

  it("handles PUT /preferences/{userId} with valid body", async () => {
    // getPreferences check -> null, putItem -> success
    mockSend.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    const event = createEvent("PUT", "/preferences/mercer", {
      maxRentUsd: 1950,
      maxCommuteMinutes: 40,
      targetDestination: "Financial District, Toronto, ON",
      transitMode: "transit",
    });

    const response = (await handler(event)) as { statusCode: number; body: string };
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe("mercer");
    expect(body.data.maxRentUsd).toBe(1950);
  });

  it("handles PUT /preferences/{userId} with invalid body with 400", async () => {
    const event = createEvent("PUT", "/preferences/mercer", {
      maxRentUsd: -100,
      targetDestination: "",
    });

    const response = (await handler(event)) as { statusCode: number; body: string };
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });
});

