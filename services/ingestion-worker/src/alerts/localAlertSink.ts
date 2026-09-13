import type { AlertSink, MatchedListing } from "../types.js";
import { renderAlertMessage } from "../filters/listingFilter.js";

export class LocalAlertSink implements AlertSink {
  constructor(private readonly dryRun: boolean) {}

  async sendMatchAlert(match: MatchedListing): Promise<void> {
    const prefix = this.dryRun ? "[DRY RUN SMS]" : "[LOCAL SMS]";
    console.log(`${prefix}\n${renderAlertMessage(match)}\n`);
  }
}
