import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const CLIENT_ID = process.env.WHOOP_CLIENT_ID!;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET!;

function getRedirectUri(origin: string) {
  return `${origin}/api/connect/whoop/callback`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: getRedirectUri(origin),
      scope: 'read:recovery read:sleep read:workout read:profile',
    });
    return NextResponse.redirect(`${WHOOP_AUTH_URL}?${params.toString()}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(origin),
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${origin}/profile?error=whoop_auth_failed`);
  }

  const tokens = await tokenResponse.json();

  await supabase.from('wearable_connections').upsert(
    {
      user_id: user.id,
      provider: 'whoop',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );

  return NextResponse.redirect(`${origin}/profile?connected=whoop`);
}
