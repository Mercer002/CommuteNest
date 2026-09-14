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

  // Selected transit modes (optional multi-modal support)
  let selectedTransitModes: TransitMode[] | undefined = undefined;
  if (obj.selectedTransitModes !== undefined && obj.selectedTransitModes !== null) {
    if (
      !Array.isArray(obj.selectedTransitModes) ||
      obj.selectedTransitModes.some((m) => typeof m !== "string" || !VALID_TRANSIT_MODES.includes(m.toLowerCase() as TransitMode))
    ) {
      errors.push(`selectedTransitModes must be an array of valid transit modes: ${VALID_TRANSIT_MODES.join(", ")}.`);
    } else {
      selectedTransitModes = Array.from(
        new Set(obj.selectedTransitModes.map((m) => m.toLowerCase() as TransitMode)),
      );
    }
  }

  // Marketplace optional numbers
  const parseOptionalInt = (key: string, min: number, max: number): number | undefined => {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") return undefined;
    const num = Number(obj[key]);
    if (!Number.isFinite(num) || num < min || num > max) {
      errors.push(`${key} must be a number between ${min} and ${max}.`);
      return undefined;
    }
    return Math.floor(num);
  };

  const parseOptionalFloat = (key: string, min: number, max: number): number | undefined => {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") return undefined;
    const num = Number(obj[key]);
    if (!Number.isFinite(num) || num < min || num > max) {
      errors.push(`${key} must be a number between ${min} and ${max}.`);
      return undefined;
    }
    return num;
  };

  const minBedrooms = parseOptionalInt("minBedrooms", 0, 10);
  const maxBedrooms = parseOptionalInt("maxBedrooms", 0, 10);
  const minBathrooms = parseOptionalFloat("minBathrooms", 0, 10);
  const minSquareFeet = parseOptionalInt("minSquareFeet", 0, 20000);
  const maxSquareFeet = parseOptionalInt("maxSquareFeet", 0, 20000);

  // Amenity boolean flags
  const parseOptionalBool = (key: string): boolean | undefined => {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") return undefined;
    return Boolean(obj[key]);
  };

  const hasGym = parseOptionalBool("hasGym");
  const hasPool = parseOptionalBool("hasPool");
  const hasLaundry = parseOptionalBool("hasLaundry");
  const utilitiesIncluded = parseOptionalBool("utilitiesIncluded");
  const hasParking = parseOptionalBool("hasParking");
  const petFriendly = parseOptionalBool("petFriendly");
  const furnished = parseOptionalBool("furnished");
  const airConditioning = parseOptionalBool("airConditioning");
  const hasBalcony = parseOptionalBool("hasBalcony");

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
      selectedTransitModes,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      minSquareFeet,
      maxSquareFeet,
      hasGym,
      hasPool,
      hasLaundry,
      utilitiesIncluded,
      hasParking,
      petFriendly,
      furnished,
      airConditioning,
      hasBalcony,
      notificationEmail,
    },
  };
}

