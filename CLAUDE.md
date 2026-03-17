# CLAUDE.md — FounderLeague: Gamified Performance Competition

## Project Overview
Gamified league where founders compete on health OPTIMIZATION metrics — not hours worked. Leaderboards for readiness consistency, sleep quality, ACWR management, rest day compliance. Anti-hustle-culture: rewards recovery, not grinding. Built-in virality through competition and sharing.

## Tech Stack
- **Framework:** Next.js 14+ (TypeScript) or React artifact with persistent storage
- **Database:** Supabase (Postgres + Realtime for live leaderboards)
- **Wearable:** Any (via FounderOS/GameDay — pull readiness scores)
- **Social:** Share cards (OG image generation for Twitter/X)
- **Payments:** Stripe (Free basic, $4.99/mo premium leagues)
- **Deployment:** Vercel

## Leaderboard Categories
```typescript
type LeaderboardCategory =
  | 'readiness_consistency'     // Lowest variance in daily readiness score
  | 'avg_readiness'             // Highest average readiness this month
  | 'sleep_consistency'         // Lowest variance in bedtime/wake time
  | 'acwr_management'           // Most days in ACWR sweet spot (0.8-1.3)
  | 'rest_compliance'           // Most rest days taken (counterintuitive!)
  | 'readiness_streak'          // Longest streak of readiness > 70
  | 'recovery_speed'            // Fastest return to baseline after peak week
  | 'tls_management';           // Lowest average Total Life Stress score
```

## Key Tables
```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'public',      -- public, private, invite-only
  max_members INT DEFAULT 20,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id),
  user_id UUID REFERENCES profiles(id),
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

CREATE TABLE league_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  user_id UUID REFERENCES profiles(id),
  week_start DATE,
  category TEXT,
  score FLOAT,
  rank INT,
  UNIQUE(league_id, user_id, week_start, category)
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  achievement_type TEXT,           -- "7_day_readiness_streak", "perfect_rest_week", etc.
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Achievement System
```typescript
const ACHIEVEMENTS = [
  { id: '7_day_streak', name: '7-Day Streak', desc: 'Readiness >70 for 7 consecutive days', icon: '🔥' },
  { id: 'perfect_rest', name: 'Perfect Rest Week', desc: 'Hit rest day target for full week', icon: '🧘' },
  { id: 'acwr_master', name: 'ACWR Master', desc: 'Stay in optimal zone (0.8-1.3) for 30 days', icon: '⚖️' },
  { id: 'sleep_champion', name: 'Sleep Champion', desc: 'Average 8+ hours for 2 weeks', icon: '🏆' },
  { id: 'recovery_king', name: 'Recovery King', desc: 'Return to baseline within 48hrs after peak', icon: '👑' },
  { id: 'deload_discipline', name: 'Deload Discipline', desc: 'Complete a full recovery week', icon: '🛡️' },
];
```

## Share Card Generation
Use `@vercel/og` to generate dynamic OG images for social sharing:
"I'm ranked #3 in my FounderLeague this week 🏆 Readiness avg: 78/100"

## Setup
1. `npx create-next-app@latest founderleague --typescript --tailwind --app`
2. `npm install @supabase/supabase-js @vercel/og stripe`
3. Build league CRUD (create, join via invite code, leave)
4. Cron job: compute weekly scores every Sunday night
5. Supabase Realtime for live leaderboard updates
