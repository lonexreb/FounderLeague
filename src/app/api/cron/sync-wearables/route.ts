import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchNormalizedOuraData, refreshOuraToken } from '@/lib/wearables/oura';
import { fetchNormalizedWhoopData, refreshWhoopToken } from '@/lib/wearables/whoop';
import { format, subDays } from 'date-fns';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const supabase = getServiceClient();
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Fetch all wearable connections
  const { data: connections } = await supabase
    .from('wearable_connections')
    .select('*');

  if (!connections || connections.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const conn of connections) {
    try {
      // Check if token needs refresh
      if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
        if (conn.provider === 'oura') {
          const newToken = await refreshOuraToken(
            conn.id,
            conn.refresh_token,
            process.env.OURA_CLIENT_ID!,
            process.env.OURA_CLIENT_SECRET!,
            supabase
          );
          conn.access_token = newToken;
        } else if (conn.provider === 'whoop') {
          const newToken = await refreshWhoopToken(
            conn.id,
            conn.refresh_token,
            process.env.WHOOP_CLIENT_ID!,
            process.env.WHOOP_CLIENT_SECRET!,
            supabase
          );
          conn.access_token = newToken;
        }
      }

      let data;
      if (conn.provider === 'oura') {
        data = await fetchNormalizedOuraData(conn.access_token, yesterday, yesterday);
      } else if (conn.provider === 'whoop') {
        data = await fetchNormalizedWhoopData(conn.access_token, yesterday, yesterday);
      }

      if (data && data.length > 0) {
        for (const metric of data) {
          await supabase.from('daily_metrics').upsert(
            {
              user_id: conn.user_id,
              date: metric.date,
              source: conn.provider,
              readiness_score: metric.readiness_score,
              sleep_score: metric.sleep_score,
              sleep_duration_hours: metric.sleep_duration_hours,
              sleep_efficiency: metric.sleep_efficiency,
              bedtime: metric.bedtime,
              wake_time: metric.wake_time,
              recovery_score: metric.recovery_score,
              strain_score: metric.strain_score,
              hrv_avg: metric.hrv_avg,
              resting_hr: metric.resting_hr,
              activity_score: metric.activity_score,
              is_rest_day: metric.is_rest_day,
              raw_data: metric.raw_data,
            },
            { onConflict: 'user_id,date,source' }
          );
        }
        synced++;
      }
    } catch (err) {
      errors.push(
        `${conn.provider}:${conn.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return NextResponse.json({ synced, errors });
}
