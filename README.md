# Andromeda

A full-stack analytics platform that tracks Discord server activity in real time and visualizes it through an interactive dashboard. Ingests events via a Discord bot, stores raw and aggregated data in PostgreSQL, exposes a REST API, and renders insights with a React frontend.

## Features

- **Real-time event ingestion** — captures messages and member joins as they happen
- **Raw + aggregated storage** — retains granular event data for flexibility while precomputing daily stats for fast queries
- **Background aggregation worker** — recomputes daily statistics every 5 minutes to keep dashboards accurate
- **REST API** — clean endpoints for guild overviews, time-series data, and user leaderboards
- **Interactive dashboard** — stat cards, area charts, and a leaderboard with Discord avatars and usernames

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bot | [discord.js](https://discord.js.org/) v14 |
| API | [Express](https://expressjs.com/) v5 |
| ORM | [Prisma](https://www.prisma.io/) v7 with `@prisma/adapter-pg` |
| Database | PostgreSQL via [Supabase](https://supabase.com/) |
| Frontend | [React](https://react.dev/) 19 + [Vite](https://vite.dev/) + [Recharts](https://recharts.org/) |
| Language | TypeScript (strict mode) |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Discord Bot │────▶│  PostgreSQL  │◀────│   Express    │
│  (Ingestion) │     │  (Supabase)  │     │   REST API   │
└──────────────┘     └──────────────┘     └──────┬───────┘
       │                    ▲                     │
       │              ┌─────┴──────┐              │
       └─────────────▶│ Aggregation│              │
                      │   Worker   │              │
                      └────────────┘              │
                                           ┌──────▼───────┐
                                           │    React     │
                                           │  Dashboard   │
                                           └──────────────┘
```

## Project Structure

```
discord-analytics/
├── src/
│   ├── bot/
│   │   ├── index.ts              # Entry point — registers events, starts API + worker
│   │   ├── client.ts             # Discord client factory
│   │   └── events/
│   │       ├── messageCreate.ts  # Logs messages to DB
│   │       └── guildMemberAdd.ts # Tracks new member joins
│   ├── api/
│   │   ├── index.ts              # Express app setup
│   │   └── routes/guild.ts       # Guild analytics endpoints
│   ├── services/
│   │   └── analyticsService.ts   # Business logic (overview, time series, leaderboard)
│   ├── db/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── users.ts              # User upsert operations
│   │   ├── guilds.ts             # Guild upsert operations
│   │   ├── messages.ts           # Raw message inserts
│   │   ├── dailyStats.ts         # Daily aggregate upserts
│   │   └── queries.ts            # Read queries
│   ├── workers/
│   │   └── aggregationWorker.ts  # Background job — recomputes DailyStats
│   └── config.ts                 # Environment variable loading + validation
├── prisma/
│   └── schema.prisma             # Database schema
├── dashboard/                    # React frontend (Vite)
│   └── src/
│       ├── App.tsx               # Main app component
│       ├── api.ts                # Typed API client
│       └── components/
│           ├── StatCard.tsx       # Key metric display
│           ├── MessagesChart.tsx  # Area chart (messages + active users over time)
│           └── Leaderboard.tsx    # Top users with avatars
└── package.json
```

## API Endpoints

All endpoints use the guild's **Discord ID** (not the internal database ID).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/guild/:id/overview` | Total messages, members, today's activity, growth vs yesterday |
| `GET` | `/guild/:id/messages-over-time?days=30` | Daily message and active user counts over N days |
| `GET` | `/guild/:id/top-users?limit=10` | Leaderboard with usernames, avatars, and message counts |
| `GET` | `/health` | Health check |

### Example Response

```
GET /guild/1234567890/overview
```

```json
{
  "guildId": "1234567890",
  "guildName": "My Server",
  "totalMessages": 1523,
  "totalMembers": 47,
  "today": {
    "messages": 84,
    "activeUsers": 12
  },
  "growth": {
    "messagesVsYesterday": 15.07
  }
}
```

## Data Model

```
User          Guild          Message         DailyStat
─────         ─────          ───────         ─────────
id            id             id              id
discordId     discordId      userId ──▶ User guildId ──▶ Guild
username      name           guildId ─▶ Guild date
avatar                       createdAt       messageCount
createdAt                                    activeUsers
```

- **Raw events** (`Message`) are stored for every message, enabling ad-hoc queries and historical analysis.
- **Aggregated stats** (`DailyStat`) are precomputed by a background worker for fast dashboard rendering.

## License

MIT
