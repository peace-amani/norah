# Silent Wolf Bot (WOLFBOT)

A professional WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys) with autosession authentication, 2000+ commands, and multi-database support.

## Stack

- **Runtime:** Node.js 22 (ESM)
- **WhatsApp:** wolfsocket (Baileys fork)
- **Primary DB:** SQLite via `better-sqlite3` (falls back to `sql.js` WASM)
- **Optional mirror DB:** PostgreSQL (`DATABASE_URL`) and/or MongoDB (`MONGODB_URI`)
- **Web server:** Express (port 5000)

## How to run

```
npm start
```

The workflow **WhatsApp Bot** runs `npm start` automatically.

## Environment variables (in `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_ID` | Yes | WhatsApp session token (WOLF-BOT:~base64 format). Without it, a QR code is shown on startup. |
| `OWNER_NUMBER` | Yes | Bot owner's phone in international format, no `+` (e.g. `254733961184`) |
| `BOT_NAME` | No | Display name shown in menus (default: WOLFBOT) |
| `BOT_PREFIX` | No | Command prefix (default: `.`) |
| `BOT_MODE` | No | `public` / `private` / `groups` (default: `public`) |
| `DATABASE_URL` | No | PostgreSQL connection string — mirrors configs for cold-restart recovery |
| `MONGODB_URI` | No | MongoDB connection string (Atlas or self-hosted) — mirrors configs + supports MongoDB auth state |

## Database architecture

- **SQLite** is always the primary store (fast, local, zero config).
- **PostgreSQL** and **MongoDB** are optional mirrors — writes are fire-and-forget; they never block SQLite.
- On cold restart (ephemeral filesystem), the bot restores settings from PG → SQLite, then from Mongo → SQLite.
- MongoDB also supports storing WhatsApp auth state via `useMongoAuthState` in `lib/authState.js`.

## Key files

| File | Purpose |
|------|---------|
| `index.js` | Main entry point — WhatsApp socket, message routing, startup |
| `lib/database.js` | SQLite CRUD layer + backup/restore |
| `lib/pgAdapter.js` | Optional PostgreSQL mirror |
| `lib/mongoAdapter.js` | Optional MongoDB mirror (new) |
| `lib/authState.js` | WhatsApp session storage (SQLite + file + MongoDB) |
| `commands/` | ~2200 command modules organized by category |

## User preferences

- Keep the existing project structure; do not restructure or rename files without asking.
- MongoDB support was added alongside existing SQLite/PostgreSQL — all three are optional mirrors of the same data.
