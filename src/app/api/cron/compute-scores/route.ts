import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeAllScores } from '@/lib/scoring';
import { detectAchievements } from '@/lib/achievements/detector';
import { getWeekStart } from '@/lib/utils';
import { subDays, format } from 'date-fns';
import type { DailyMetric, LeaderboardCategory } from '@/types';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const supabase = getServiceClient();
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekStart = getWeekStart(new Date());
  // Get data from last 28 days for ACWR and other calculations
  const dataStart = format(subDays(new Date(), 28), 'yyyy-MM-dd');

  // Get all leagues
  const { data: leagues } = await supabase.from('leagues').select('id');
  if (!leagues) return NextResponse.json({ computed: 0 });

  let computed = 0;

  for (const league of leagues) {
    // Get league members
    const { data: members } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', league.id);

    if (!members || members.length === 0) continue;

    const userScores: {
      user_id: string;
      scores: Record<LeaderboardCategory, number>;
    }[] = [];

    for (const member of members) {
      // Fetch daily metrics for the user
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', member.user_id)
        .gte('date', dataStart)
        .order('date', { ascending: true });

      const typedMetrics = (metrics || []) as DailyMetric[];
      const scores = computeAllScores(typedMetrics, weekStart);
      userScores.push({ user_id: member.user_id, scores });

      // Detect achievements
      const newAchievements = detectAchievements(typedMetrics);
      for (const achievementType of newAchievements) {
        await supabase.from('achievements').upsert(
          {
            user_id: member.user_id,
            achievement_type: achievementType,
          },
          { onConflict: 'user_id,achievement_type', ignoreDuplicates: true }
        );
      }
    }

    // Rank users per category
    const categories: LeaderboardCategory[] = [
      'readiness_consistency', 'avg_readiness', 'sleep_consistency',
      'acwr_management', 'rest_compliance', 'readiness_streak',
      'recovery_speed', 'tls_management',
    ];

    for (const category of categories) {
      const sorted = [...userScores].sort(
        (a, b) => b.scores[category] - a.scores[category]
      );

      for (let i = 0; i < sorted.length; i++) {
        await supabase.from('league_scores').upsert(
          {
            league_id: league.id,
            user_id: sorted[i].user_id,
            week_start: weekStart,
            category,
            score: sorted[i].scores[category],
            rank: i + 1,
          },
          { onConflict: 'league_id,user_id,week_start,category' }
        );
      }
    }

    computed++;
  }

  return NextResponse.json({ computed, week: weekStart });
}
