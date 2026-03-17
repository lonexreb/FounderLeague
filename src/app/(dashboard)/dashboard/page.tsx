export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, Activity, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's leagues
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, type, max_members)")
    .eq("user_id", user.id);

  // Fetch recent achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })
    .limit(5);

  // Fetch latest daily metrics
  const { data: latestMetrics } = await supabase
    .from("daily_metrics")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(7);

  const profile = user.user_metadata;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.display_name || user.email?.split("@")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s your health optimization overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600/10 p-2">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">My Leagues</p>
              <p className="text-2xl font-bold">{memberships?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600/10 p-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Achievements</p>
              <p className="text-2xl font-bold">{achievements?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-600/10 p-2">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Latest Readiness</p>
              <p className="text-2xl font-bold">
                {latestMetrics?.[0]?.readiness_score
                  ? `${Math.round(latestMetrics[0].readiness_score)}/100`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* My Leagues */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Leagues</h2>
          <Link
            href="/leagues"
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {memberships && memberships.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {memberships.map((m) => {
              const league = m.leagues as unknown as {
                id: string;
                name: string;
                type: string;
              };
              return (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{league.name}</h3>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                      {league.type}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-sm text-slate-400">
              You haven&apos;t joined any leagues yet.
            </p>
            <Link
              href="/leagues"
              className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Browse leagues <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Recent Metrics */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Metrics</h2>
        {latestMetrics && latestMetrics.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Readiness</th>
                  <th className="pb-3 font-medium">Sleep</th>
                  <th className="pb-3 font-medium">Recovery</th>
                  <th className="pb-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {latestMetrics.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3">{m.date}</td>
                    <td className="py-3">
                      {m.readiness_score ? `${Math.round(m.readiness_score)}` : "—"}
                    </td>
                    <td className="py-3">
                      {m.sleep_duration_hours
                        ? `${m.sleep_duration_hours.toFixed(1)}h`
                        : "—"}
                    </td>
                    <td className="py-3">
                      {m.recovery_score ? `${Math.round(m.recovery_score)}` : "—"}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize">
                        {m.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-sm text-slate-400">No metrics yet.</p>
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Connect a wearable <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
