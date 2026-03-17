import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check league exists and is public
  const { data: league } = await supabase
    .from('leagues')
    .select('id, type, max_members')
    .eq('id', id)
    .single();

  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }

  if (league.type !== 'public') {
    return NextResponse.json({ error: 'League is not public' }, { status: 403 });
  }

  // Check member count
  const { count } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', id);

  if (count && count >= league.max_members) {
    return NextResponse.json({ error: 'League is full' }, { status: 400 });
  }

  // Join
  const { error } = await supabase.from('league_members').insert({
    league_id: id,
    user_id: user.id,
    display_name:
      user.user_metadata?.display_name || user.email?.split('@')[0],
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Redirect back to league page
  return NextResponse.redirect(new URL(`/leagues/${id}`, request.url));
}
