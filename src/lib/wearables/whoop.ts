import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Shared normalized type
// ---------------------------------------------------------------------------

export interface WearableData {
  date: string;
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
  raw_data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Whoop API raw response types
// ---------------------------------------------------------------------------

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage: number | null;
  skin_temp_celsius: number | null;
}

export interface WhoopRecoveryItem {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: WhoopRecoveryScore;
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}

export interface WhoopSleepScore {
  stage_summary: {
    total_in_bed_time_milli: number;
    total_awake_time_milli: number;
    total_no_data_time_milli: number;
    total_light_sleep_time_milli: number;
    total_slow_wave_sleep_time_milli: number;
    total_rem_sleep_time_milli: number;
    sleep_cycle_count: number;
    disturbance_count: number;
  };
  sleep_needed: {
    baseline_milli: number;
    need_from_sleep_debt_milli: number;
    need_from_recent_strain_milli: number;
    need_from_recent_nap_milli: number;
  };
  respiratory_rate: number | null;
  sleep_performance_percentage: number | null;
  sleep_consistency_percentage: number | null;
  sleep_efficiency_percentage: number | null;
}

export interface WhoopSleepItem {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: WhoopSleepScore;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter: number | null;
  altitude_gain_meter: number | null;
  altitude_change_meter: number | null;
  zone_duration: {
    zone_zero_milli: number;
    zone_one_milli: number;
    zone_two_milli: number;
    zone_three_milli: number;
    zone_four_milli: number;
    zone_five_milli: number;
  };
}

export interface WhoopWorkoutItem {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: WhoopWorkoutScore;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WHOOP_BASE_URL = 'https://api.prod.whoop.com/developer/v1';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// ---------------------------------------------------------------------------
// OAuth2 helpers
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeWhoopCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<WhoopTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whoop token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<WhoopTokenResponse>;
}

/**
 * Refresh an expired access token and persist the new tokens in the
 * wearable_connections table.
 *
 * Returns the fresh access token string.
 */
export async function refreshWhoopToken(
  connectionId: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  supabase: SupabaseClient,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whoop token refresh failed (${res.status}): ${text}`);
  }

  const tokens: WhoopTokenResponse = await res.json();

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await supabase
    .from('wearable_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
    })
    .eq('id', connectionId);

  if (error) {
    throw new Error(`Failed to persist refreshed Whoop tokens: ${error.message}`);
  }

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function whoopFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${WHOOP_BASE_URL}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whoop API ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Data fetching functions
// ---------------------------------------------------------------------------

/**
 * Fetch recovery data for a date range.
 * `startDate` and `endDate` should be YYYY-MM-DD strings.
 * The Whoop API expects ISO-8601 datetime strings for its filter params.
 */
export async function fetchWhoopRecovery(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<WhoopRecoveryItem[]> {
  const items: WhoopRecoveryItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.999Z`,
      limit: '25',
    };
    if (nextToken) {
      params.nextToken = nextToken;
    }

    const response = await whoopFetch<WhoopPaginatedResponse<WhoopRecoveryItem>>(
      'recovery',
      accessToken,
      params,
    );

    items.push(...response.records);
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

/**
 * Fetch sleep data for a date range.
 * Filters out naps and only returns primary sleep periods.
 */
export async function fetchWhoopSleep(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<WhoopSleepItem[]> {
  const items: WhoopSleepItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.999Z`,
      limit: '25',
    };
    if (nextToken) {
      params.nextToken = nextToken;
    }

    const response = await whoopFetch<WhoopPaginatedResponse<WhoopSleepItem>>(
      'activity/sleep',
      accessToken,
      params,
    );

    // Only keep primary sleep, not naps
    items.push(...response.records.filter((s) => !s.nap));
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

/**
 * Fetch workout / strain data for a date range.
 */
export async function fetchWhoopWorkouts(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<WhoopWorkoutItem[]> {
  const items: WhoopWorkoutItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.999Z`,
      limit: '25',
    };
    if (nextToken) {
      params.nextToken = nextToken;
    }

    const response = await whoopFetch<WhoopPaginatedResponse<WhoopWorkoutItem>>(
      'activity/workout',
      accessToken,
      params,
    );

    items.push(...response.records);
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/** Extract YYYY-MM-DD from an ISO datetime string. */
function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

/**
 * Pull recovery, sleep, and workout data for the given date range and return
 * a normalized `WearableData[]` array keyed by date.
 */
export async function fetchNormalizedWhoopData(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<WearableData[]> {
  const [recovery, sleep, workouts] = await Promise.all([
    fetchWhoopRecovery(accessToken, startDate, endDate),
    fetchWhoopSleep(accessToken, startDate, endDate),
    fetchWhoopWorkouts(accessToken, startDate, endDate),
  ]);

  // Index by date for quick lookup
  const recoveryMap = new Map<string, WhoopRecoveryItem>();
  for (const r of recovery) {
    recoveryMap.set(toDateKey(r.created_at), r);
  }

  const sleepMap = new Map<string, WhoopSleepItem>();
  for (const s of sleep) {
    // Key by the end (wake) date since that represents the morning the sleep belongs to
    sleepMap.set(toDateKey(s.end), s);
  }

  // Aggregate workouts per day (sum strain)
  const workoutMap = new Map<string, { totalStrain: number; items: WhoopWorkoutItem[] }>();
  for (const w of workouts) {
    const dateKey = toDateKey(w.start);
    const existing = workoutMap.get(dateKey);
    if (existing) {
      existing.totalStrain += w.score.strain;
      existing.items.push(w);
    } else {
      workoutMap.set(dateKey, { totalStrain: w.score.strain, items: [w] });
    }
  }

  // Collect all unique dates
  const allDates = new Set<string>();
  for (const r of recovery) allDates.add(toDateKey(r.created_at));
  for (const s of sleep) allDates.add(toDateKey(s.end));
  for (const w of workouts) allDates.add(toDateKey(w.start));

  const results: WearableData[] = [];

  for (const date of Array.from(allDates).sort()) {
    const r = recoveryMap.get(date);
    const s = sleepMap.get(date);
    const w = workoutMap.get(date);

    const stageSummary = s?.score?.stage_summary;
    const totalSleepMillis = stageSummary
      ? stageSummary.total_light_sleep_time_milli +
        stageSummary.total_slow_wave_sleep_time_milli +
        stageSummary.total_rem_sleep_time_milli
      : null;

    const sleepDurationHours =
      totalSleepMillis != null
        ? parseFloat((totalSleepMillis / 3_600_000).toFixed(2))
        : null;

    // Whoop strain below 4 or no workouts typically indicates a rest day
    const isRestDay = w ? w.totalStrain < 4 : true;

    results.push({
      date,
      readiness_score: null, // Whoop does not have readiness; recovery serves a similar purpose
      sleep_score: s?.score?.sleep_performance_percentage ?? null,
      sleep_duration_hours: sleepDurationHours,
      sleep_efficiency: s?.score?.sleep_efficiency_percentage ?? null,
      bedtime: s?.start ?? null,
      wake_time: s?.end ?? null,
      recovery_score: r?.score?.recovery_score ?? null,
      strain_score: w?.totalStrain ?? null,
      hrv_avg: r?.score?.hrv_rmssd_milli != null
        ? parseFloat((r.score.hrv_rmssd_milli).toFixed(1))
        : null,
      resting_hr: r?.score?.resting_heart_rate ?? null,
      activity_score: null, // Whoop does not have an activity score
      is_rest_day: isRestDay,
      raw_data: {
        recovery: r ?? null,
        sleep: s ?? null,
        workouts: w?.items ?? null,
      },
    });
  }

  return results;
}
