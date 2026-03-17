export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Globe, Lock } from "lucide-react";
import { CreateLeagueDialog } from "@/components/league/create-league-dialog";
import { JoinLeagueDialog } from "@/components/league/join-league-dialog";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's leagues
  const { data: myMemberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  const myLeagueIds = myMemberships?.map((m) => m.league_id) || [];

  // Fetch leagues with member counts
  const { data: myLeagues } = myLeagueIds.length > 0
    ? await supabase
        .from("leagues")
        .select("*, league_members(count)")
        .in("id", myLeagueIds)
    : { data: [] };

  // Fetch public leagues user hasn't joined
  const { data: publicLeagues } = await supabase
    .from("leagues")
    .select("*, league_members(count)")
    .eq("type", "public")
    .not("id", "in", myLeagueIds.length > 0 ? `(${myLeagueIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .limit(20);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leagues</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create, join, and compete in leagues
          </p>
        </div>
        <div className="flex items-center gap-3">
          <JoinLeagueDialog />
          <CreateLeagueDialog />
        </div>
      </div>

      {/* My Leagues */}
      <section>
        <h2 className="text-lg font-semibold">My Leagues</h2>
        {myLeagues && myLeagues.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myLeagues.map((league) => {
              const memberCount =
                (league.league_members as unknown as { count: number }[])?.[0]
                  ?.count || 0;
              return (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {league.type === "public" ? (
                      <Globe className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-500" />
                    )}
                    <h3 className="font-medium">{league.name}</h3>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      {memberCount}/{league.max_members} members
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 capitalize">
                      {league.type}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            You haven&apos;t joined any leagues yet.
          </p>
        )}
      </section>

      {/* Browse Public Leagues */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Browse Public Leagues</h2>
        {publicLeagues && publicLeagues.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicLeagues.map((league) => {
              const memberCount =
                (league.league_members as unknown as { count: number }[])?.[0]
                  ?.count || 0;
              return (
                <div
                  key={league.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <h3 className="font-medium">{league.name}</h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {memberCount}/{league.max_members} members
                    </span>
                    <form action={`/api/leagues/${league.id}/join`} method="POST">
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                      >
                        Join
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No public leagues available right now.
          </p>
        )}
      </section>
    </div>
  );
}
