import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import type { AlertSink, MatchedListing } from "../types.js";

export interface SnsAlertSinkOptions {
  topicArn: string;
  client?: SNSClient;
}

export class SnsAlertSink implements AlertSink {
  private readonly topicArn: string;
  private readonly client: SNSClient;

  constructor(options: SnsAlertSinkOptions) {
    if (!options.topicArn) {
      throw new Error("SnsAlertSink requires a topicArn.");
    }

    this.topicArn = options.topicArn;
    this.client = options.client ?? new SNSClient({});
  }

  async sendMatchAlert(match: MatchedListing): Promise<void> {
    const { listing, commute } = match;

    const rawSubject = `[CommuteNest] $${listing.priceUsd}/mo - ${commute.durationMinutes}m commute: ${listing.title}`;
    const subject = rawSubject.length > 100 ? `${rawSubject.slice(0, 97)}...` : rawSubject;

    const lines = [
      "CommuteNest Housing Alert",
      "=================================",
      `Title: ${listing.title}`,
      `Rent: $${listing.priceUsd}/month`,
      `Commute: ${commute.durationMinutes} minutes (${commute.provider} provider)`,
      `Origin: ${commute.originAddress}`,
      `Destination: ${commute.destinationAddress}`,
    ];

    if (commute.distanceText) {
      lines.push(`Distance: ${commute.distanceText}`);
    }

    lines.push(`Listing URL: ${listing.url}`);
    lines.push(`Source: ${listing.sourceName}`);
    lines.push("=================================");

    const message = lines.join("\n");

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: subject,
        Message: message,
      }),
    );
  }
}

