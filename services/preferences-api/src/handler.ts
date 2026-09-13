import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PreferencesRepository } from "./repository.js";
import type { ApiResponse } from "./types.js";
import { validateUpdatePreferencesInput, validateUserId } from "./validator.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
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

  // Match /preferences/{userId}
  const match = path.match(/^\/preferences\/([^/]+)\/?$/);
  const rawUserId = event.pathParameters?.userId ?? (match ? decodeURIComponent(match[1]) : undefined);

  if (!rawUserId) {
    return jsonResponse(404, {
      success: false,
      error: "Not Found. Available routes: GET /health, GET /preferences/{userId}, PUT /preferences/{userId}, DELETE /preferences/{userId}",
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
    switch (method) {
      case "GET": {
        const record = await repo.getPreferences(userId);
        if (!record) {
          return jsonResponse(404, {
            success: false,
            error: `Preferences for user '${userId}' not found.`,
          });
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

