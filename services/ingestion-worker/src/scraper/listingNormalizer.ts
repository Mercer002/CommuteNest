import { createHash } from "node:crypto";
import type { Listing, RawListing } from "../types.js";

export function normalizeRawListing(raw: RawListing): Listing | null {
  const searchableText = [raw.title, raw.description].filter(Boolean).join("\n");
  const priceUsd = raw.priceUsd ?? parseRentUsd(searchableText);
  const address = raw.address ?? extractAddress(searchableText);

  if (!priceUsd || !address || !raw.url) {
    return null;
  }

  return {
    id: stableListingId(raw),
    sourceName: raw.sourceName,
    title: cleanWhitespace(raw.title),
    url: raw.url,
    description: raw.description ? cleanWhitespace(raw.description) : undefined,
    publishedAt: raw.publishedAt,
    address: cleanWhitespace(address),
    priceUsd,
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
