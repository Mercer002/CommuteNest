# Phase 1: Local Proof of Concept

This worker scrapes RSS-style listing feeds, normalizes rent and address data, calculates commute time, applies budget and commute filters, and emits local SMS-style alerts. Cloud resources are intentionally not included yet; DynamoDB and SNS are represented by small local adapters that will be replaced in later phases.

## Prerequisites

- Node.js 20 or newer
- A Google Maps API key with Distance Matrix API enabled, only if using `DISTANCE_PROVIDER=google`

## Install

```bash
npm run phase1:install
```

## Run The Fixture Demo

```bash
npm run phase1:demo
```

The first run should alert on matching fixture listings and write `.local/seen-listings.json`. A second run should skip the same listings as already seen.

## Run With Google Maps

```bash
cp services/ingestion-worker/.env.example services/ingestion-worker/.env
```

Edit `services/ingestion-worker/.env`:

```env
DISTANCE_PROVIDER=google
GOOGLE_MAPS_API_KEY=your_key_here
TARGET_DESTINATION=your_office_or_school_address
LISTING_SOURCE_URL=https://example.com/listings.rss
```

Then run:

```bash
npm --prefix services/ingestion-worker run dev
```

## Quality Checks

```bash
npm run phase1:typecheck
npm run phase1:test
```
