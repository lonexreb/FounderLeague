"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LeaderboardCategory, LeagueScore } from "@/types";
import { LeaderboardTable } from "./leaderboard-table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CategoryInfo {
  value: LeaderboardCategory;
  label: string;
  description: string;
}

interface Props {
  leagueId: string;
  activeCategory: string;
  categories: CategoryInfo[];
  scores: (LeagueScore & {
    profiles: { display_name: string | null; avatar_url: string | null } | null;
  })[];
  weeks: string[];
  activeWeek: string | null;
  currentUserId: string;
}

export function LeaderboardTabs({
  leagueId,
  activeCategory,
  categories,
  scores,
  weeks,
  activeWeek,
  currentUserId,
}: Props) {
  const router = useRouter();

  function handleCategoryChange(category: string) {
    const params = new URLSearchParams();
    params.set("category", category);
    if (activeWeek) params.set("week", activeWeek);
    router.push(`/leagues/${leagueId}?${params.toString()}`);
  }

  function handleWeekChange(week: string) {
    const params = new URLSearchParams();
    params.set("category", activeCategory);
    params.set("week", week);
    router.push(`/leagues/${leagueId}?${params.toString()}`);
  }

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category Description */}
      <p className="mt-3 text-sm text-slate-400">
        {categories.find((c) => c.value === activeCategory)?.description}
      </p>

      {/* Week Selector */}
      {weeks.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-slate-400">Week of:</span>
          <select
            value={activeWeek || ""}
            onChange={(e) => handleWeekChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {weeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="mt-6">
        <LeaderboardTable
          scores={scores}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
