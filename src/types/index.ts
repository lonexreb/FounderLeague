export type LeaderboardCategory =
  | 'readiness_consistency'
  | 'avg_readiness'
  | 'sleep_consistency'
  | 'acwr_management'
  | 'rest_compliance'
  | 'readiness_streak'
  | 'recovery_speed'
  | 'tls_management';

export const LEADERBOARD_CATEGORIES: {
  value: LeaderboardCategory;
  label: string;
  description: string;
  betterIs: 'higher' | 'lower';
}[] = [
  { value: 'readiness_consistency', label: 'Readiness Consistency', description: 'Lowest variance in daily readiness score', betterIs: 'higher' },
  { value: 'avg_readiness', label: 'Avg Readiness', description: 'Highest average readiness this month', betterIs: 'higher' },
  { value: 'sleep_consistency', label: 'Sleep Consistency', description: 'Lowest variance in bedtime/wake time', betterIs: 'higher' },
  { value: 'acwr_management', label: 'ACWR Management', description: 'Most days in ACWR sweet spot (0.8–1.3)', betterIs: 'higher' },
  { value: 'rest_compliance', label: 'Rest Compliance', description: 'Most rest days taken', betterIs: 'higher' },
  { value: 'readiness_streak', label: 'Readiness Streak', description: 'Longest streak of readiness > 70', betterIs: 'higher' },
  { value: 'recovery_speed', label: 'Recovery Speed', description: 'Fastest return to baseline after peak week', betterIs: 'higher' },
  { value: 'tls_management', label: 'TLS Management', description: 'Lowest average Total Life Stress score', betterIs: 'higher' },
];

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  type: 'public' | 'private' | 'invite-only';
  max_members: number;
  created_by: string;
  invite_code: string | null;
  created_at: string;
}

export interface LeagueMember {
  league_id: string;
  user_id: string;
  display_name: string | null;
  joined_at: string;
}

export interface LeagueScore {
  id: string;
  league_id: string;
  user_id: string;
  week_start: string;
  category: LeaderboardCategory;
  score: number;
  rank: number;
}

export interface DailyMetric {
  id: string;
  user_id: string;
  date: string;
  source: 'oura' | 'whoop';
  readiness_score: number | null;
  sleep_score: number | null;
  sleep_duration_hours: number | null;
  sleep_efficiency: number | null;
  bedtime: string | null;
  wake_time: string | null;
  recovery_score: number | null;
  strain_score: number | null;
  hrv_avg: number | null;
  resting_hr: number | null;
  activity_score: number | null;
  is_rest_day: boolean;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface WearableConnection {
  id: string;
  user_id: string;
  provider: 'oura' | 'whoop';
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  provider_user_id: string | null;
  connected_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  earned_at: string;
}

export const ACHIEVEMENTS = [
  { id: '7_day_streak', name: '7-Day Streak', desc: 'Readiness >70 for 7 consecutive days', icon: '🔥' },
  { id: 'perfect_rest', name: 'Perfect Rest Week', desc: 'Hit rest day target for full week', icon: '🧘' },
  { id: 'acwr_master', name: 'ACWR Master', desc: 'Stay in optimal zone (0.8-1.3) for 30 days', icon: '⚖️' },
  { id: 'sleep_champion', name: 'Sleep Champion', desc: 'Average 8+ hours for 2 weeks', icon: '🏆' },
  { id: 'recovery_king', name: 'Recovery King', desc: 'Return to baseline within 48hrs after peak', icon: '👑' },
  { id: 'deload_discipline', name: 'Deload Discipline', desc: 'Complete a full recovery week', icon: '🛡️' },
] as const;

export type AchievementType = typeof ACHIEVEMENTS[number]['id'];

export interface LeagueWithMembers extends League {
  member_count: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  rank: number;
  prev_rank: number | null;
}
