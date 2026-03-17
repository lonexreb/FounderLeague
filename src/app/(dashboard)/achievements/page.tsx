export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ACHIEVEMENTS } from "@/types";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: earned } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id);

  const earnedIds = new Set(earned?.map((a) => a.achievement_type) || []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Achievements</h1>
      <p className="mt-1 text-sm text-slate-400">
        Track your milestones and unlock badges
      </p>

      <div className="mt-4 text-sm text-slate-400">
        {earnedIds.size}/{ACHIEVEMENTS.length} unlocked
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = earnedIds.has(achievement.id);
          const earnedDate = earned?.find(
            (a) => a.achievement_type === achievement.id
          )?.earned_at;

          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-xl border p-6 transition-colors",
                unlocked
                  ? "border-indigo-500/30 bg-indigo-950/20"
                  : "border-slate-800 bg-slate-900/50 opacity-60"
              )}
            >
              <div className="text-4xl">{achievement.icon}</div>
              <h3 className="mt-3 font-semibold">{achievement.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{achievement.desc}</p>
              {unlocked && earnedDate && (
                <p className="mt-3 text-xs text-indigo-400">
                  Earned {new Date(earnedDate).toLocaleDateString()}
                </p>
              )}
              {!unlocked && (
                <p className="mt-3 text-xs text-slate-600">Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
