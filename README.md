<p align="center">
  <br />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</p>

<h1 align="center">
  <br />
  FounderLeague
  <br />
</h1>

<h3 align="center">
  Compete on Health, Not Hustle.
</h3>

<p align="center">
  A gamified league platform where founders compete on <strong>readiness, sleep quality, and recovery</strong> — not hours worked.<br />
  Connect your wearable. Join a league. Climb the leaderboard.<br />
  <strong>Anti-hustle-culture:</strong> rewards recovery, not grinding.
</p>

---

## What Is This?

FounderLeague turns health optimization into a competition. Founders join leagues, connect their Oura Ring or Whoop band, and compete across **8 leaderboard categories** that reward consistency, rest, and recovery.

**The philosophy:** The founder who sleeps well, manages stress, and takes rest days will outperform the one grinding 18-hour days. FounderLeague makes that measurable and competitive.

---

## Features

| Feature | Description |
|---------|-------------|
| **8 Leaderboard Categories** | Readiness consistency, avg readiness, sleep consistency, ACWR management, rest compliance, readiness streak, recovery speed, TLS management |
| **Wearable Integration** | Oura Ring + Whoop via OAuth2 — daily data sync via cron |
| **League System** | Create public/private leagues, join via invite code, up to 100 members |
| **Achievement Engine** | 6 unlockable badges — 7-day streaks, perfect rest weeks, ACWR mastery, and more |
| **Social Sharing** | Dynamic OG image cards for Twitter/X — show off your rank |
| **Stripe Payments** | Free tier (1 public league) / Premium $4.99/mo (unlimited private leagues, analytics) |
| **Live Leaderboards** | Supabase Realtime for live score updates |
| **Auth** | Email + Google OAuth via Supabase Auth |

---

## Leaderboard Categories

| Category | What It Measures | Better = |
|----------|-----------------|----------|
| Readiness Consistency | Lowest variance in daily readiness score | Lower variance |
| Avg Readiness | Highest average readiness this month | Higher avg |
| Sleep Consistency | Lowest variance in bedtime/wake time | Lower variance |
| ACWR Management | Most days in ACWR sweet spot (0.8–1.3) | Higher % |
| Rest Compliance | Most rest days taken | More rest |
| Readiness Streak | Longest streak of readiness > 70 | Longer streak |
| Recovery Speed | Fastest return to baseline after peak week | Faster recovery |
| TLS Management | Lowest average Total Life Stress score | Lower stress |

---

## Tech Stack

```
Next.js 16          Framework (App Router, Turbopack, TypeScript)
Supabase            Postgres + Auth + Realtime + Row Level Security
Stripe              Checkout + Webhooks + Customer Portal
Oura API v2         Readiness, sleep, activity data
Whoop API           Recovery, strain, sleep data
Tailwind CSS v4     Styling
Zustand             Client state
Recharts            Score trend charts
Zod                 Schema validation
Vercel              Deployment + Cron jobs
```

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Authenticated pages
│   │   ├── dashboard/            # User home — stats, leagues, metrics
│   │   ├── leagues/              # Browse, create, join leagues
│   │   ├── leagues/[id]/         # League detail + 8-category leaderboard
│   │   ├── achievements/         # Achievement gallery (locked/unlocked)
│   │   └── profile/              # Account + connected wearables
│   ├── api/
│   │   ├── connect/oura|whoop/   # Wearable OAuth2 flows
│   │   ├── cron/sync-wearables/  # Daily: pull data from APIs
│   │   ├── cron/compute-scores/  # Weekly: compute scores + achievements
│   │   ├── webhooks/stripe/      # Stripe subscription events
│   │   ├── checkout/             # Create Stripe Checkout session
│   │   ├── billing/portal/       # Stripe Customer Portal
│   │   ├── leagues/[id]/join/    # Join a public league
│   │   └── og/                   # Dynamic OG share card images
│   ├── login/ & signup/          # Auth pages
│   └── page.tsx                  # Landing page
├── components/
│   ├── leaderboard/              # Table, category tabs, share button
│   ├── league/                   # Create/join dialogs, league header
│   ├── charts/                   # Score trend chart (Recharts)
│   ├── profile/                  # Profile form, wearable connections
│   └── ui/                       # Button, Card, Input, Badge, Tabs,
│                                 # Avatar, Modal, Skeleton, Toast
├── lib/
│   ├── scoring/                  # All 8 scoring algorithms + orchestrator
│   ├── achievements/             # Achievement detection engine
│   ├── wearables/                # Oura + Whoop API clients
│   ├── supabase/                 # Client, server, middleware
│   ├── stripe.ts                 # Stripe helpers
│   └── utils.ts                  # cn(), invite codes, week math
├── types/index.ts                # All TypeScript types + constants
└── middleware.ts                 # Auth guard
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/lonexreb/FounderLeague.git
cd FounderLeague
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration:
   ```bash
   # In the Supabase SQL editor, paste and run:
   supabase/migrations/001_initial_schema.sql
   ```
3. Enable Google OAuth in **Authentication > Providers**

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks |
| `STRIPE_PREMIUM_PRICE_ID` | Create a $4.99/mo recurring price in Stripe |
| `OURA_CLIENT_ID` / `SECRET` | [Oura Developer Portal](https://cloud.ouraring.com/v2/docs) |
| `WHOOP_CLIENT_ID` / `SECRET` | [Whoop Developer Portal](https://developer.whoop.com) |
| `CRON_SECRET` | Any random string for securing cron endpoints |

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deploy to Vercel with one click — cron jobs are configured in `vercel.json`:

- **Daily 6am UTC** — `/api/cron/sync-wearables` (pulls wearable data)
- **Weekly Monday midnight UTC** — `/api/cron/compute-scores` (computes rankings)

Set all environment variables in Vercel > Settings > Environment Variables.

---

## Pricing Model

| | Free | Premium ($4.99/mo) |
|---|---|---|
| Public leagues | 1 | Unlimited |
| Private leagues | -- | Unlimited |
| Leaderboard categories | All 8 | All 8 |
| Achievements | Yes | Yes |
| Analytics & charts | -- | Yes |
| Social share cards | -- | Yes |

---

## License

MIT

---

<p align="center">
  <sub>Built with obsessive attention to recovery.</sub>
</p>
