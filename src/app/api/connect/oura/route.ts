import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';
const CLIENT_ID = process.env.OURA_CLIENT_ID!;
const CLIENT_SECRET = process.env.OURA_CLIENT_SECRET!;

function getRedirectUri(origin: string) {
  return `${origin}/api/connect/oura/callback`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // If no code, redirect to Oura OAuth
  if (!code) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: getRedirectUri(origin),
      scope: 'daily readiness sleep activity',
    });
    return NextResponse.redirect(`${OURA_AUTH_URL}?${params.toString()}`);
  }

  // Exchange code for tokens
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const tokenResponse = await fetch(OURA_TOKEN_URL, {
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
    return NextResponse.redirect(`${origin}/profile?error=oura_auth_failed`);
  }

  const tokens = await tokenResponse.json();

  await supabase.from('wearable_connections').upsert(
    {
      user_id: user.id,
      provider: 'oura',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );

  return NextResponse.redirect(`${origin}/profile?connected=oura`);
}
