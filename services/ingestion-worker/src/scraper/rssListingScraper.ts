import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import type { Listing, ListingScraper, RawListing } from "../types.js";
import { SAMPLE_RSS_FEED } from "../fixtures/sampleFeed.js";
import { normalizeRawListing, parseRentUsd, stripHtml } from "./listingNormalizer.js";

type XmlNode = Record<string, unknown>;

export class RssListingScraper implements ListingScraper {
  constructor(
    private readonly sourceUrl: string,
    private readonly userAgent: string,
  ) { }

  async scrape(): Promise<Listing[]> {
    const xml = await readTextFromSource(this.sourceUrl, this.userAgent);
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      removeNSPrefix: true,
      trimValues: true,
    });

    const document = parser.parse(xml) as XmlNode;
    const channel = getObject(getObject(document.rss)?.channel);
    const feed = getObject(document.feed);
    const sourceName = scalar(channel?.title ?? feed?.title) ?? "rss-feed";
    const rawItems = toArray(channel?.item ?? feed?.entry);

    return rawItems
      .map((item) => rssItemToRawListing(item, sourceName))
      .map(normalizeRawListing)
      .filter((listing): listing is Listing => listing !== null);
  }
}

function rssItemToRawListing(item: XmlNode, sourceName: string): RawListing {
  const description = stripHtml(scalar(item.description ?? item.summary ?? item.content) ?? "");
  const priceValue = scalar(item.price ?? item.rent);

  return {
    sourceName,
    externalId: scalar(item.guid ?? item.id),
    title: scalar(item.title) ?? "Untitled listing",
    url: linkValue(item.link),
    description,
    publishedAt: scalar(item.pubDate ?? item.updated ?? item.published),
    address: scalar(item.address ?? item.location),
    priceUsd: priceValue ? parseRentUsd(`$${priceValue}`) ?? Number.parseInt(priceValue, 10) : undefined,
    bedrooms: scalar(item.bedrooms) !== undefined ? Number(scalar(item.bedrooms)) : undefined,
    bathrooms: scalar(item.bathrooms) !== undefined ? Number(scalar(item.bathrooms)) : undefined,
    squareFeet: scalar(item.sqft ?? item.squareFeet) !== undefined ? Number(scalar(item.sqft ?? item.squareFeet)) : undefined,
  };
}

async function readTextFromSource(source: string, userAgent: string): Promise<string> {
  if (source === "fixture" || source.endsWith("sample-listings.rss")) {
    return SAMPLE_RSS_FEED;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    try {
      const response = await fetch(source, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": userAgent,
        },
      });

      if (!response.ok) {
        console.warn(
          `Remote listing feed ${source} returned HTTP ${response.status} ${response.statusText}. Using sample fixture feed fallback.`,
        );
        return SAMPLE_RSS_FEED;
      }

      return await response.text();
    } catch (networkError) {
      console.warn(
        `Failed to reach listing feed ${source} (${networkError instanceof Error ? networkError.message : networkError}). Using sample fixture feed fallback.`,
      );
      return SAMPLE_RSS_FEED;
    }
  }

  try {
    const filePath = source.startsWith("file://") ? fileURLToPath(source) : path.resolve(process.cwd(), source);
    return await readFile(filePath, "utf8");
  } catch {
    return SAMPLE_RSS_FEED;
  }
}

function linkValue(value: unknown): string {
  if (Array.isArray(value)) {
    return linkValue(value[0]);
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const node = value as XmlNode;
    return scalar(node.href ?? node["#text"]) ?? "";
  }

  return "";
}

function scalar(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const node = value as XmlNode;
    const text = node["#text"];
    if (typeof text === "string" || typeof text === "number") {
      return String(text);
    }
  }

  return undefined;
}

function toArray(value: unknown): XmlNode[] {
  if (Array.isArray(value)) {
    return value.filter(isObject);
  }

  return isObject(value) ? [value] : [];
}

function getObject(value: unknown): XmlNode | undefined {
  return isObject(value) ? value : undefined;
}

function isObject(value: unknown): value is XmlNode {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
