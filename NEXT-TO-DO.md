# FounderLeague — Next To-Do

## Immediate Setup
- [ ] Create Supabase project and run `supabase/migrations/001_initial_schema.sql`
- [ ] Configure Supabase Auth providers (Email + Google OAuth)
- [ ] Create Stripe product + price for Premium ($4.99/mo)
- [ ] Register Oura developer app → get client ID/secret
- [ ] Register Whoop developer app → get client ID/secret
- [ ] Copy `.env.local.example` → `.env.local` and fill all credentials
- [ ] Set `CRON_SECRET` in Vercel environment variables

## Polish & UX
- [ ] Add loading skeletons to all data-fetching pages
- [ ] Add error boundaries with retry UI
- [ ] Mobile responsive pass (sidebar → hamburger menu)
- [ ] Toast notifications for league join/leave/create actions
- [ ] Animate achievement unlock (confetti or glow)
- [ ] Add empty states with illustrations

## Features to Build
- [ ] Supabase Realtime subscription on `league_scores` for live leaderboard updates
- [ ] Week-over-week rank trend indicators (up/down arrows with delta)
- [ ] Score trend chart on league detail page (wire up `ScoreTrendChart`)
- [ ] User profile avatars (Supabase Storage upload)
- [ ] League chat / activity feed
- [ ] Email notifications for weekly rank changes
- [ ] Invite link sharing (deep link to join page)

## Testing
- [ ] Unit tests (Vitest) for all 8 scoring algorithms with edge cases
- [ ] Unit tests for achievement detector
- [ ] Integration tests for Supabase RLS policies
- [ ] E2E tests (Playwright) for auth flow, league CRUD, leaderboard nav
- [ ] Manual test: connect real Oura/Whoop → verify data pipeline → verify scores

## Infra & DevOps
- [ ] Deploy to Vercel, verify cron jobs fire on schedule
- [ ] Set up Stripe webhook endpoint in Stripe dashboard
- [ ] Add rate limiting to API routes
- [ ] Add Sentry or similar error monitoring
- [ ] Set up CI/CD (GitHub Actions → lint + type-check + test)

## Future / V2
- [ ] Terra API integration (support Garmin, Apple Watch, Fitbit)
- [ ] League seasons with start/end dates and trophies
- [ ] Global leaderboard across all leagues
- [ ] Team leagues (company vs company)
- [ ] Weekly digest email with personalized insights
- [ ] Admin dashboard for league creators
