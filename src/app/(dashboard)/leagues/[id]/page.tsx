export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LeaderboardTabs } from "@/components/leaderboard/leaderboard-tabs";
import { LeagueHeader } from "@/components/league/league-header";
import { LEADERBOARD_CATEGORIES } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; week?: string }>;
}

export default async function LeagueDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { category, week } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch league
  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .single();

  if (!league) notFound();

  // Check membership
  const { data: membership } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", id)
    .eq("user_id", user.id)
    .single();

  // Fetch members
  const { data: members } = await supabase
    .from("league_members")
    .select("*, profiles(display_name, avatar_url)")
    .eq("league_id", id);

  // Active category
  const activeCategory = category || "avg_readiness";

  // Fetch scores for the active category
  const scoreQuery = supabase
    .from("league_scores")
    .select("*, profiles(display_name, avatar_url)")
    .eq("league_id", id)
    .eq("category", activeCategory)
    .order("rank", { ascending: true });

  if (week) {
    scoreQuery.eq("week_start", week);
  } else {
    // Get latest week
    scoreQuery.order("week_start", { ascending: false });
  }

  const { data: scores } = await scoreQuery;

  // Get unique weeks for the week selector
  const { data: weeks } = await supabase
    .from("league_scores")
    .select("week_start")
    .eq("league_id", id)
    .order("week_start", { ascending: false });

  const uniqueWeeks = [...new Set(weeks?.map((w) => w.week_start) || [])];

  return (
    <div>
      <LeagueHeader
        league={league}
        isMember={!!membership}
        memberCount={members?.length || 0}
        userId={user.id}
      />

      <div className="mt-8">
        <LeaderboardTabs
          leagueId={id}
          activeCategory={activeCategory}
          categories={LEADERBOARD_CATEGORIES}
          scores={scores || []}
          weeks={uniqueWeeks}
          activeWeek={week || uniqueWeeks[0] || null}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
