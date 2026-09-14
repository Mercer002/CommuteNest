import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { findMatchingListings } from "./matcher.js";
import { PreferencesRepository } from "./repository.js";
import type { ApiResponse } from "./types.js";
import { validateUpdatePreferencesInput, validateUserId } from "./validator.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function jsonResponse(statusCode: number, body: ApiResponse): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

let repositoryInstance: PreferencesRepository | null = null;
let snsClientInstance: SNSClient | null = null;

function getRepository(): PreferencesRepository {
  if (!repositoryInstance) {
    const tableName = process.env.USER_PREFERENCES_TABLE_NAME;
    if (!tableName) {
      throw new Error("USER_PREFERENCES_TABLE_NAME environment variable is required.");
    }
    repositoryInstance = new PreferencesRepository({ tableName });
  }
  return repositoryInstance;
}

export function setRepository(repo: PreferencesRepository): void {
  repositoryInstance = repo;
}

function getSnsClient(): SNSClient {
  if (!snsClientInstance) {
    snsClientInstance = new SNSClient({});
  }
  return snsClientInstance;
}

export function setSnsClient(client: SNSClient): void {
  snsClientInstance = client;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext?.http?.method?.toUpperCase() ?? "GET";
  const path = event.rawPath ?? "";

  // Handle preflight CORS OPTIONS requests
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  // Health check endpoint
  if (method === "GET" && (path === "/health" || path === "/health/")) {
    return jsonResponse(200, {
      success: true,
      data: {
        status: "healthy",
        service: "commutenest-preferences-api",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Check for routes
  const emailDealsMatch = path.match(/^\/preferences\/([^/]+)\/email-deals\/?$/);
  const scanMatch = path.match(/^\/preferences\/([^/]+)\/scan\/?$/);
  const prefsMatch = path.match(/^\/preferences\/([^/]+)\/?$/);

  const isEmailDealsRoute = Boolean(emailDealsMatch);
  const isScanRoute = Boolean(scanMatch);

  const rawUserId = event.pathParameters?.userId ?? (
    emailDealsMatch
      ? decodeURIComponent(emailDealsMatch[1])
      : scanMatch
        ? decodeURIComponent(scanMatch[1])
        : prefsMatch
          ? decodeURIComponent(prefsMatch[1])
          : undefined
  );

  if (!rawUserId) {
    return jsonResponse(404, {
      success: false,
      error: "Not Found. Available routes: GET /health, GET /preferences/{userId}, PUT /preferences/{userId}, POST /preferences/{userId}/scan, POST /preferences/{userId}/email-deals, DELETE /preferences/{userId}",
    });
  }

  const userIdValidation = validateUserId(rawUserId);
  if (!userIdValidation.valid) {
    return jsonResponse(400, {
      success: false,
      errors: userIdValidation.errors,
    });
  }

  const userId = userIdValidation.data;
  const repo = getRepository();

  try {
    if (isEmailDealsRoute) {
      const topicArn = process.env.ALERTS_TOPIC_ARN;
      if (!topicArn) {
        return jsonResponse(500, {
          success: false,
          error: "ALERTS_TOPIC_ARN is not configured on the API server.",
        });
      }

      let prefs = await repo.getPreferences(userId);
      if (!prefs) {
        prefs = {
          userId,
          maxRentUsd: 1800,
          maxCommuteMinutes: 35,
          targetDestination: "Union Station, Toronto, ON",
          transitMode: "transit",
          transitModes: ["bus", "subway", "train"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const matches = findMatchingListings(prefs);
      const deals = matches.filter((m) => m.isGoodDeal);

      if (deals.length === 0) {
        return jsonResponse(200, {
          success: true,
          data: {
            sent: false,
            message: "No current listings qualify as good deals under these constraints.",
          },
        });
      }

      const destName = prefs.targetDestination.split(",")[0] || prefs.targetDestination;
      const subject = `🔥 CommuteNest: ${deals.length} Top Deal${deals.length > 1 ? "s" : ""} Found near ${destName}!`;
      const messageLines = [
        `CommuteNest Verified Housing Deals Alert`,
        `========================================`,
        ``,
        `Hello ${userId},`,
        ``,
        `We identified ${deals.length} verified good deal(s) matching your transit criteria for ${destName}:`,
        ``,
        ...deals.map((deal, idx) => [
          `#${idx + 1}. ${deal.title}`,
          `   Price:   $${deal.priceUsd}/month (${deal.dealReason || "Under budget"})`,
          `   Commute: ${deal.commuteSummary}`,
          `   Address: ${deal.address}`,
          `   Listing: ${deal.url}`,
          ``,
        ].join("\n")),
        `----------------------------------------`,
        `CommuteNest Serverless Engine • AWS CloudFront + DynamoDB + SNS`,
      ];

      const snsClient = getSnsClient();
      await snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: subject,
          Message: messageLines.join("\n"),
        }),
      );

      return jsonResponse(200, {
        success: true,
        data: {
          sent: true,
          dealCount: deals.length,
          message: `Dispatched email alert with ${deals.length} top deal(s) to your registered email!`,
        },
      });
    }

    if (isScanRoute) {
      let prefs = await repo.getPreferences(userId);
      if (!prefs) {
        prefs = {
          userId,
          maxRentUsd: 1800,
          maxCommuteMinutes: 35,
          targetDestination: "Union Station, Toronto, ON",
          transitMode: "transit",
          transitModes: ["bus", "subway", "train"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (event.body) {
        try {
          const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body, "base64").toString("utf-8")
            : event.body;
          const parsed = JSON.parse(rawBody || "{}");
          if (parsed.maxRentUsd) prefs.maxRentUsd = Number(parsed.maxRentUsd);
          if (parsed.maxCommuteMinutes) prefs.maxCommuteMinutes = Number(parsed.maxCommuteMinutes);
          if (parsed.targetDestination) prefs.targetDestination = String(parsed.targetDestination);
          if (parsed.transitMode) prefs.transitMode = parsed.transitMode;
        } catch {
          // Keep loaded preferences if body cannot be parsed
        }
      }

      const matches = findMatchingListings(prefs);
      await repo.saveRecentMatches(userId, matches);

      return jsonResponse(200, {
        success: true,
        data: {
          matches,
          count: matches.length,
          scannedAt: new Date().toISOString(),
          preferences: prefs,
        },
      });
    }

    switch (method) {
      case "GET": {
        let record = await repo.getPreferences(userId);
        if (!record) {
          return jsonResponse(404, {
            success: false,
            error: `Preferences for user '${userId}' not found.`,
          });
        }
        if (!record.recentMatches || record.recentMatches.length === 0) {
          const initialMatches = findMatchingListings(record);
          record.recentMatches = initialMatches;
          record.lastScanAt = new Date().toISOString();
          await repo.saveRecentMatches(userId, initialMatches);
        }
        return jsonResponse(200, {
          success: true,
          data: record,
        });
      }

      case "PUT": {
        let body: unknown;
        try {
          const rawBody = event.isBase64Encoded && event.body
            ? Buffer.from(event.body, "base64").toString("utf-8")
            : event.body;
          body = JSON.parse(rawBody || "{}");
        } catch {
          return jsonResponse(400, {
            success: false,
            error: "Malformed JSON payload in request body.",
          });
        }

        const validation = validateUpdatePreferencesInput(body);
        if (!validation.valid) {
          return jsonResponse(400, {
            success: false,
            errors: validation.errors,
          });
        }

        const saved = await repo.upsertPreferences(userId, validation.data);
        return jsonResponse(200, {
          success: true,
          data: saved,
        });
      }

      case "DELETE": {
        const deleted = await repo.deletePreferences(userId);
        if (!deleted) {
          return jsonResponse(404, {
            success: false,
            error: `Preferences for user '${userId}' not found.`,
          });
        }
        return jsonResponse(200, {
          success: true,
          data: { deleted: true, userId },
        });
      }

      default:
        return jsonResponse(405, {
          success: false,
          error: `Method '${method}' not allowed.`,
        });
    }
  } catch (error) {
    console.error("Preferences API Error:", error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}

