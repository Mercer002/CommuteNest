import type { TransitMode, UpdatePreferencesInput, ValidationResult } from "./types.js";

const VALID_TRANSIT_MODES: TransitMode[] = ["transit", "driving", "walking", "bicycling"];
const USER_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserId(userId: unknown): ValidationResult<string> {
  if (typeof userId !== "string" || !userId.trim()) {
    return { valid: false, errors: ["userId is required and must be a string."] };
  }

  const trimmed = userId.trim();
  if (!USER_ID_REGEX.test(trimmed)) {
    return {
      valid: false,
      errors: ["userId must be 1-64 characters containing only alphanumeric characters, hyphens, and underscores."],
    };
  }

  return { valid: true, data: trimmed };
}

export function validateUpdatePreferencesInput(input: unknown): ValidationResult<UpdatePreferencesInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Request body must be a valid JSON object."] };
  }

  const obj = input as Record<string, unknown>;
  const errors: string[] = [];

  // Rent validation
  const maxRentUsd = Number(obj.maxRentUsd);
  if (!Number.isFinite(maxRentUsd) || maxRentUsd <= 0 || maxRentUsd > 100000) {
    errors.push("maxRentUsd must be a positive number up to 100,000.");
  }

  // Commute validation
  const maxCommuteMinutes = Number(obj.maxCommuteMinutes);
  if (!Number.isFinite(maxCommuteMinutes) || maxCommuteMinutes <= 0 || maxCommuteMinutes > 300) {
    errors.push("maxCommuteMinutes must be a positive integer between 1 and 300 minutes.");
  }

  // Destination validation
  const targetDestination = typeof obj.targetDestination === "string" ? obj.targetDestination.trim() : "";
  if (!targetDestination || targetDestination.length > 250) {
    errors.push("targetDestination is required and must be between 1 and 250 characters.");
  }

  // Transit mode validation
  const transitMode = String(obj.transitMode).toLowerCase() as TransitMode;
  if (!VALID_TRANSIT_MODES.includes(transitMode)) {
    errors.push(`transitMode must be one of: ${VALID_TRANSIT_MODES.join(", ")}.`);
  }

  // Transit modes array (optional)
  let transitModes: string[] = ["bus", "subway", "train"];
  if (obj.transitModes !== undefined) {
    if (!Array.isArray(obj.transitModes) || obj.transitModes.some((m) => typeof m !== "string" || !m.trim())) {
      errors.push("transitModes must be an array of non-empty strings.");
    } else {
      transitModes = (obj.transitModes as string[]).map((m) => m.trim());
    }
  }

  // Notification email (optional)
  let notificationEmail: string | undefined = undefined;
  if (obj.notificationEmail !== undefined && obj.notificationEmail !== null && obj.notificationEmail !== "") {
    if (typeof obj.notificationEmail !== "string" || !EMAIL_REGEX.test(obj.notificationEmail.trim())) {
      errors.push("notificationEmail must be a valid email address.");
    } else {
      notificationEmail = obj.notificationEmail.trim();
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      maxRentUsd: Math.round(maxRentUsd),
      maxCommuteMinutes: Math.round(maxCommuteMinutes),
      targetDestination,
      transitMode,
      transitModes,
      notificationEmail,
    },
  };
}

