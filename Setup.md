# Sentinel - Setup Guide

This guide walks you through setting up the Sentinel web dashboard for local development and production deployment.

## Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 8.0+ (recommended) or npm/yarn
- **Sentinel Selfbot** backend running and accessible

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Privex-chat/sentinel-web.git
cd sentinel-web
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Development Server

```bash
pnpm dev
```

The application is available at `http://localhost:3000`.

There is **no `.env.local` config needed** for the panel itself. The selfbot API URL and `API_AUTH_TOKEN` are entered in the in-browser **Settings** page on first launch and persisted to `localStorage`.

> ⚠ The deprecated `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_KEY` documented in older versions of this file are not read by any current code. `NEXT_PUBLIC_*` env vars are inlined into the browser bundle at build time — placing a real API token there ships it to every visitor.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DESKTOP_BUILD` | Build-time only | Set to `true` by the Electron packaging script to produce a static export (`next.config.ts:isDesktop`). Do not set manually. |

That's it. Everything else is runtime configuration that the user enters in the Settings page.

## Backend Requirements

The panel speaks to the [sentinel-selfbot](https://github.com/Privex-chat/sentinel-selfbot) HTTP API. Spin the selfbot up first — the panel's [`/setup`](http://localhost:3000/setup) wizard walks you through the three supported deployment paths (local, VPS, Railway).

The full API contract lives in [`lib/api.ts`](./lib/api.ts) — that is the source of truth for what endpoints the panel calls. The selfbot exposes all of them; you don't need to wire anything up manually.

### CORS

The selfbot ships with an **allowlist** by default — `https://sentinel-panel.vercel.app`, `http://localhost:5173`, and `http://localhost:3000`. If you self-host the panel on a different domain (your own Vercel deployment, internal subdomain, etc.) set `API_CORS_ORIGINS` on the selfbot to a comma-separated list, e.g.:

```env
API_CORS_ORIGINS=https://panel.example.com,http://localhost:3000
```

A literal `*` value reflects any origin — useful when fronting the API yourself with another auth layer.

Methods (`GET/POST/PUT/PATCH/DELETE/OPTIONS`) and headers (`Authorization`, `Content-Type`) remain unchanged. No credentialed requests.

If you put the API behind a reverse proxy, make sure it doesn't strip the `Authorization` header or buffer the `text/event-stream` response on `/api/events/stream` (set `X-Accel-Buffering: no` for nginx).

### Rate limiting

The selfbot enforces **300 req/min/IP** out of the box (configurable in `src/api/server.ts`). The unauthenticated `/health` endpoint is allowlisted, so polling it for liveness never consumes the budget. SSE (`/api/events/stream`) is a single long-lived connection — it counts as one request, not one per event.

### Liveness probe

`/health` is unauthenticated and returns `{ status: "ok", uptimeMs, gatewayConnected }`. Point Railway/Fly/uptime monitors there instead of `/api/status` so they don't need the API token.

### Error responses

Unhandled handler errors now return `{ error: "Internal server error", requestId: "..." }` — the matching detail (including stack) lives in the selfbot's logs keyed by that same `requestId`. Schema-validation errors surface as `{ error: "Invalid request", details, requestId }` at HTTP 400. The panel surfaces `error` directly via its `request()` helper.

## Development

### Project Scripts

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Type check
pnpm type-check
```

### Code Structure

```
lib/
├── api.ts        # API client - modify endpoints here
├── types.ts      # TypeScript types - update for API changes
├── context.tsx   # React context - global state management
├── hooks.ts      # Custom hooks - data fetching logic
└── utils.ts      # Utility functions

components/
├── ui/           # Reusable UI primitives
├── charts/       # Data visualization components
├── dashboard/    # Dashboard-specific components
└── layout/       # Layout components (sidebar, header)

app/
├── page.tsx              # Dashboard home
├── targets/[userId]/     # Target detail pages
├── alerts/               # Alert management
└── settings/             # Application settings
```

### Adding New Features

1. **New API endpoint**: Add the method to `lib/api.ts`
2. **New data type**: Add TypeScript interface to `lib/types.ts`
3. **New page**: Create under `app/` directory following Next.js App Router conventions
4. **New component**: Add to appropriate folder under `components/`

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Self-Hosted

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

For production, use a process manager like PM2:

```bash
pm2 start npm --name "sentinel" -- start
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t sentinel-web .
docker run -p 3000:3000 sentinel-web
```

The API URL is entered in the browser on first launch — there is nothing to pass via `-e`.

## Troubleshooting

### Connection Issues

**Problem**: Dashboard shows "Disconnected" or "Connection Failed"

**Solutions**:
1. Open Settings and confirm the API URL points at a running selfbot
2. Confirm the API token matches the selfbot's `API_AUTH_TOKEN`
3. If the selfbot is hosted, check the reverse proxy isn't blocking or stripping the `Authorization` header
4. Check the browser console for the exact error

### SSE Not Working

**Problem**: Live feed not updating in real-time

**Solutions**:
1. Confirm `/api/events/stream` is reachable behind your reverse proxy with `X-Accel-Buffering: no`
2. Check long-lived connections aren't being killed by an upstream timeout (Cloudflare default is 100 s, Vercel free is 10 s)
3. The panel auto-reconnects with exponential backoff up to 30 s, and replays missed events via `?since=<lastEventId>` — verify the selfbot version is recent enough to honour the `since` query param (added in the same audit pass)

### Rate-limit 429s

**Problem**: Dashboard suddenly stops loading data; browser network tab shows HTTP 429 with `Retry-After` header.

**Solutions**:
1. The selfbot's default budget is **300 req/min/IP**. If multiple tabs poll the same selfbot from the same IP they share that budget. Close idle tabs.
2. If you're hosting a multi-user panel behind a single egress IP, raise the cap in `src/api/server.ts`.
3. `/health` is allowlisted — use it for liveness, not `/api/status`.

### Export download (NDJSON)

The full export endpoint now streams **NDJSON** (one JSON object per line, Content-Type `application/x-ndjson`). The panel's `api.downloadExport(userId)` helper handles the Blob/file-save dance; `api.exportData(userId)` parses the stream into a `{ section: rows[] }` map for in-memory use. The previous "everything in one JSON tree" response shape is gone — any external tooling that consumed the old format needs to either read line-by-line or use the CSV path (`/api/export/:userId/csv`).

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
1. Run `pnpm type-check` to identify type issues
2. Ensure all dependencies are installed: `pnpm install`
3. Clear `.next` cache: `rm -rf .next && pnpm build`

## Support

For issues and feature requests, please open an issue on the GitHub repository.
