# Base44 Dev Environment — WOLFBOT (silent-wolf-bot)

## What this is
A WhatsApp bot built on Baileys (`wolfsocket` fork) with an Express status/health web server. The web server (`lib/webServer.js`) binds `0.0.0.0:3000` and starts **before** WhatsApp auth, so the status page renders even when the bot is not connected.

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
- Image: `Dockerfile.base44` (extends `node:22-slim`, adds `python3 make g++ ffmpeg git` for native modules + media).
- Source is bind-mounted at `/app`; `node_modules`, `data`, and `session` are named volumes so installs/session persist across restarts.
- `npm install` runs on every boot (fast when cached; the `postinstall` script `scripts/patch-modules.cjs` patches baileys shims — do not skip it).
- Runs under `nodemon` watching `index.js`, `lib/`, `settings.js` — edits restart the process. There is no live-reload dev server; call `reload_preview` after changes if needed.

## Credentials
- `SESSION_ID` (secret) — WhatsApp session ID starting with `WOLF-BOT:`. Without it the bot falls through to an interactive login prompt (which hangs in the non-TTY container) and stays offline; the status page still serves. Delivered via `/run/base44/app.env`.
- `DATABASE_URL` / `MONGODB_URI` (optional) — external Postgres/Mongo. Left blank → the bot uses local SQLite (no external DB needed).
- Other optional config (`BOT_PREFIX`, `BOT_MODE`, `BOT_NAME`, `BOT_TIMEZONE`, `OWNER_NUMBER`, `PHONE_NUMBER`) lives in `.env.base44-defaults` or the dashboard.

## Verify it works
- `curl -sf http://localhost:3000/` returns the WOLFBOT status HTML.
- `curl -sf http://localhost:3000/api/status` returns JSON; `connected:false` until a valid `SESSION_ID` is supplied.
- External preview: `curl -sf -H "Host: 3000-${BASE44_PUBLIC_HOST_SUFFIX}" http://localhost:3000/` must return the page.
