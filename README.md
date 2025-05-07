# Directory Functions

This repository contains Cloudflare Functions (Workers) for the multi-directory project.

## Functions

- **directory-webhook**: Receives webhooks from NocoDB and triggers Cloudflare Pages builds
- **directory**: API for fetching directory data
- **listings**: API for fetching listings data
- **search**: API for searching listings

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.dev.vars` file with your environment variables (see `.env.example`)
4. Run locally: `npm run dev`
5. Deploy: `npm run deploy`

## Environment Variables

- `NOCODB_API_URL`: URL for your NocoDB API
- `NOCODB_AUTH_TOKEN`: Authentication token for NocoDB
- `CF_API_TOKEN`: Cloudflare API token with Pages deployment permissions
- `CF_ACCOUNT_ID`: Your Cloudflare account ID

## Webhook Configuration

Configure your NocoDB instance to send webhooks to:

```
https://directory-functions.your-workers-subdomain.workers.dev/api/directory-webhook
```

## API Endpoints

- `GET /api/directory?id=<directoryId>`: Get directory data
- `GET /api/listings?directory=<directoryId>`: Get listings for a directory
- `GET /api/search?directory=<directoryId>&q=<query>`: Search listings in a directory