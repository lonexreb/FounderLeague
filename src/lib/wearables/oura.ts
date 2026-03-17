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
// Oura API v2 raw response types
// ---------------------------------------------------------------------------

export interface OuraTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface OuraReadinessItem {
  id: string;
  day: string;
  score: number | null;
  temperature_deviation: number | null;
  contributors: {
    activity_balance: number | null;
    body_temperature: number | null;
    hrv_balance: number | null;
    previous_day_activity: number | null;
    previous_night: number | null;
    recovery_index: number | null;
    resting_heart_rate: number | null;
    sleep_balance: number | null;
  };
}

export interface OuraReadinessResponse {
  data: OuraReadinessItem[];
  next_token: string | null;
}

export interface OuraSleepItem {
  id: string;
  day: string;
  score: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
  total_sleep_duration: number | null; // seconds
  efficiency: number | null;
  average_hrv: number | null;
  lowest_heart_rate: number | null;
  type: string;
}

export interface OuraSleepResponse {
  data: OuraSleepItem[];
  next_token: string | null;
}

export interface OuraActivityItem {
  id: string;
  day: string;
  score: number | null;
  active_calories: number | null;
  total_calories: number | null;
  steps: number | null;
  equivalent_walking_distance: number | null;
  low_activity_meet_daily_targets: number | null;
  medium_activity_meet_daily_targets: number | null;
  high_activity_meet_daily_targets: number | null;
  meet_daily_targets: number | null;
  target_calories: number | null;
}

export interface OuraActivityResponse {
  data: OuraActivityItem[];
  next_token: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OURA_BASE_URL = 'https://api.ouraring.com/v2/usercollection';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

// ---------------------------------------------------------------------------
// OAuth2 helpers
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeOuraCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<OuraTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oura token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<OuraTokenResponse>;
}

/**
 * Refresh an expired access token and persist the new tokens in the
 * wearable_connections table.
 *
 * Returns the fresh access token string.
 */
export async function refreshOuraToken(
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

  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oura token refresh failed (${res.status}): ${text}`);
  }

  const tokens: OuraTokenResponse = await res.json();

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
    throw new Error(`Failed to persist refreshed Oura tokens: ${error.message}`);
  }

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function ouraFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${OURA_BASE_URL}/${path}`);
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
    throw new Error(`Oura API ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Data fetching functions
// ---------------------------------------------------------------------------

/**
 * Fetch daily readiness data for a date range (inclusive).
 * Dates should be formatted as YYYY-MM-DD.
 */
export async function fetchOuraReadiness(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<OuraReadinessItem[]> {
  const items: OuraReadinessItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (nextToken) {
      params.next_token = nextToken;
    }

    const response = await ouraFetch<OuraReadinessResponse>(
      'daily_readiness',
      accessToken,
      params,
    );

    items.push(...response.data);
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

/**
 * Fetch daily sleep data for a date range (inclusive).
 */
export async function fetchOuraSleep(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<OuraSleepItem[]> {
  const items: OuraSleepItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (nextToken) {
      params.next_token = nextToken;
    }

    const response = await ouraFetch<OuraSleepResponse>(
      'daily_sleep',
      accessToken,
      params,
    );

    items.push(...response.data);
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

/**
 * Fetch daily activity data for a date range (inclusive).
 */
export async function fetchOuraActivity(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<OuraActivityItem[]> {
  const items: OuraActivityItem[] = [];
  let nextToken: string | null = null;

  do {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (nextToken) {
      params.next_token = nextToken;
    }

    const response = await ouraFetch<OuraActivityResponse>(
      'daily_activity',
      accessToken,
      params,
    );

    items.push(...response.data);
    nextToken = response.next_token;
  } while (nextToken);

  return items;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Pull readiness, sleep, and activity data for the given date range and return
 * a normalized `WearableData[]` array keyed by date.
 */
export async function fetchNormalizedOuraData(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<WearableData[]> {
  const [readiness, sleep, activity] = await Promise.all([
    fetchOuraReadiness(accessToken, startDate, endDate),
    fetchOuraSleep(accessToken, startDate, endDate),
    fetchOuraActivity(accessToken, startDate, endDate),
  ]);

  // Index by day for quick lookup
  const readinessMap = new Map(readiness.map((r) => [r.day, r]));
  const sleepMap = new Map(sleep.map((s) => [s.day, s]));
  const activityMap = new Map(activity.map((a) => [a.day, a]));

  // Collect all unique dates
  const allDates = new Set([
    ...readiness.map((r) => r.day),
    ...sleep.map((s) => s.day),
    ...activity.map((a) => a.day),
  ]);

  const results: WearableData[] = [];

  for (const date of Array.from(allDates).sort()) {
    const r = readinessMap.get(date);
    const s = sleepMap.get(date);
    const a = activityMap.get(date);

    const sleepDurationHours =
      s?.total_sleep_duration != null
        ? parseFloat((s.total_sleep_duration / 3600).toFixed(2))
        : null;

    // Determine rest day: activity score below 30 or no significant activity
    const isRestDay = a?.score != null ? a.score < 30 : false;

    results.push({
      date,
      readiness_score: r?.score ?? null,
      sleep_score: s?.score ?? null,
      sleep_duration_hours: sleepDurationHours,
      sleep_efficiency: s?.efficiency ?? null,
      bedtime: s?.bedtime_start ?? null,
      wake_time: s?.bedtime_end ?? null,
      recovery_score: null, // Oura does not have a dedicated recovery score
      strain_score: null,   // Oura does not have a strain score
      hrv_avg: s?.average_hrv ?? null,
      resting_hr: s?.lowest_heart_rate ?? null,
      activity_score: a?.score ?? null,
      is_rest_day: isRestDay,
      raw_data: {
        readiness: r ?? null,
        sleep: s ?? null,
        activity: a ?? null,
      },
    });
  }

  return results;
}
