import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SeenListingsStore } from "../types.js";

interface SeenListingsFile {
  version: 1;
  seenListingIds: string[];
}

export class LocalSeenListingsStore implements SeenListingsStore {
  private seenListingIds = new Set<string>();

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as SeenListingsFile;
      this.seenListingIds = new Set(parsed.seenListingIds ?? []);
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        await mkdir(path.dirname(this.filePath), { recursive: true });
        this.seenListingIds = new Set();
        return;
      }

      throw error;
    }
  }

  async has(listingId: string): Promise<boolean> {
    return this.seenListingIds.has(listingId);
  }

  async markSeen(listingId: string): Promise<void> {
    this.seenListingIds.add(listingId);
    await this.persist();
  }

  private async persist(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const payload: SeenListingsFile = {
      version: 1,
      seenListingIds: Array.from(this.seenListingIds).sort(),
    };

    await writeFile(this.filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
