import { createHash } from "node:crypto";
import type { Listing, ListingAmenities, RawListing } from "../types.js";

export function normalizeRawListing(raw: RawListing): Listing | null {
  const searchableText = [raw.title, raw.description].filter(Boolean).join("\n");
  const priceUsd = raw.priceUsd ?? parseRentUsd(searchableText);
  const address = raw.address ?? extractAddress(searchableText);

  if (!priceUsd || !address || !raw.url) {
    return null;
  }

  const bedrooms = raw.bedrooms ?? extractBedrooms(searchableText);
  const bathrooms = raw.bathrooms ?? extractBathrooms(searchableText);
  const squareFeet = raw.squareFeet ?? extractSquareFeet(searchableText);
  const amenities = raw.amenities ?? extractAmenities(searchableText);

  return {
    id: stableListingId(raw),
    sourceName: raw.sourceName,
    title: cleanWhitespace(raw.title),
    url: raw.url,
    description: raw.description ? cleanWhitespace(raw.description) : undefined,
    publishedAt: raw.publishedAt,
    address: cleanWhitespace(address),
    priceUsd,
    bedrooms,
    bathrooms,
    squareFeet,
    amenities,
  };
}

export function parseRentUsd(text: string): number | undefined {
  const normalized = cleanWhitespace(stripHtml(text));
  const matches = Array.from(normalized.matchAll(/\$\s*([1-9][0-9,]{2,})/g));
  const candidates = matches
    .map((match) => ({
      value: Number.parseInt(match[1].replaceAll(",", ""), 10),
      context: normalized.slice(Math.max(0, match.index - 30), match.index + match[0].length + 50).toLowerCase(),
      before: normalized.slice(Math.max(0, match.index - 24), match.index).toLowerCase(),
    }))
    .filter((candidate) => Number.isFinite(candidate.value));

  const rentCandidate =
    candidates.find((candidate) => isRentContext(candidate.context) && !isNonRentContext(candidate.before)) ??
    candidates.find((candidate) => !isNonRentContext(candidate.before));

  return rentCandidate?.value;
}

export function extractAddress(text: string): string | undefined {
  const normalized = stripHtml(text);
  const patterns = [
    /\baddress\s*:\s*([^.\n|;]+)/i,
    /\blocation\s*:\s*([^.\n|;]+)/i,
    /\bnear\s+([0-9][^.\n|;]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return cleanWhitespace(match[1]);
    }
  }

  return undefined;
}

export function stripHtml(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, " "));
}

export function stableListingId(raw: RawListing): string {
  const stableKey = [raw.sourceName, raw.externalId ?? raw.url, raw.title].join("|");

  return createHash("sha256").update(stableKey).digest("hex").slice(0, 24);
}

export function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function isRentContext(context: string): boolean {
  return /\b(rent|monthly|month|mo|studio|bedroom|br|room|sublet|lease|apartment|condo|unit)\b/.test(context);
}

function isNonRentContext(context: string): boolean {
  return /\b(deposit|security|fee|application|broker|utilities)\b/.test(context);
}

export function extractBedrooms(text: string): number | undefined {
  const normalized = stripHtml(text).toLowerCase();
  if (/\b(studio|bachelor)\b/i.test(normalized)) {
    return 0;
  }
  const digitMatch = normalized.match(/\b([0-9])\s*(?:bed|bedroom|br|bdr)\b/i);
  if (digitMatch?.[1]) {
    return Number.parseInt(digitMatch[1], 10);
  }
  const wordMatches: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
  };
  const wordMatch = normalized.match(/\b(one|two|three|four)\s*(?:bed|bedroom|br|bdr)\b/i);
  if (wordMatch?.[1] && wordMatches[wordMatch[1]]) {
    return wordMatches[wordMatch[1]];
  }
  return undefined;
}

export function extractBathrooms(text: string): number | undefined {
  const normalized = stripHtml(text).toLowerCase();
  const digitMatch = normalized.match(/\b([0-9](?:\.5)?)\s*(?:bath|bathroom|ba|bth)\b/i);
  if (digitMatch?.[1]) {
    return Number.parseFloat(digitMatch[1]);
  }
  const wordMatches: Record<string, number> = {
    one: 1,
    two: 2,
  };
  const wordMatch = normalized.match(/\b(one|two)\s*(?:bath|bathroom|ba|bth)\b/i);
  if (wordMatch?.[1] && wordMatches[wordMatch[1]]) {
    return wordMatches[wordMatch[1]];
  }
  return undefined;
}

export function extractSquareFeet(text: string): number | undefined {
  const normalized = stripHtml(text).toLowerCase();
  const match = normalized.match(/\b([0-9]{3,4})\s*(?:sq\s*ft|sqft|ft2|square\s*feet|square\s*foot)\b/i);
  if (match?.[1]) {
    return Number.parseInt(match[1], 10);
  }
  return undefined;
}

export function extractAmenities(text: string): ListingAmenities {
  const normalized = stripHtml(text).toLowerCase();
  return {
    gym: /\b(gym|fitness|workout|exercise\s*room)\b/i.test(normalized),
    pool: /\b(pool|swimming)\b/i.test(normalized),
    laundry: /\b(laundry|washer|dryer|in-suite\s*laundry|in-unit\s*laundry)\b/i.test(normalized),
    utilitiesIncluded: /\b(utilities\s*included|all\s*inclusive|hydro\s*included|heat\s*included)\b/i.test(normalized),
    parking: /\b(parking|garage|driveway|parking\s*spot)\b/i.test(normalized),
    petFriendly: /\b(pet\s*friendly|pets\s*allowed|dogs\s*ok|cats\s*ok|pets\s*welcome)\b/i.test(normalized),
    furnished: /\b(furnished|fully\s*furnished)\b/i.test(normalized),
    airConditioning: /\b(air\s*conditioning|a\/c|ac|central\s*air)\b/i.test(normalized),
    balcony: /\b(balcony|terrace|patio|deck)\b/i.test(normalized),
  };
}
