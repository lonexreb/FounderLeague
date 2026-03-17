"use client";

import { cn } from "@/lib/utils";
import type { LeagueScore } from "@/types";
import { Trophy, Medal } from "lucide-react";

interface Props {
  scores: (LeagueScore & {
    profiles: { display_name: string | null; avatar_url: string | null } | null;
  })[];
  currentUserId: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
        <Trophy className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/20 text-slate-300">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-amber-600">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center text-sm text-slate-500">
      {rank}
    </div>
  );
}

function UserAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-medium text-indigo-400">
      {initials}
    </div>
  );
}

export function LeaderboardTable({ scores, currentUserId }: Props) {
  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
        <p className="text-sm text-slate-400">
          No scores yet. Scores are computed weekly.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50 text-left text-xs text-slate-400">
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {scores.map((score) => {
            const name =
              score.profiles?.display_name || `User ${score.user_id.slice(0, 6)}`;
            const isCurrentUser = score.user_id === currentUserId;

            return (
              <tr
                key={score.id}
                className={cn(
                  "transition-colors",
                  isCurrentUser
                    ? "bg-indigo-950/20"
                    : "hover:bg-slate-900/30"
                )}
              >
                <td className="px-4 py-3">
                  <RankBadge rank={score.rank} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={name}
                      avatarUrl={score.profiles?.avatar_url || null}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrentUser ? "text-indigo-400" : "text-white"
                      )}
                    >
                      {name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-slate-500">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-mono font-medium">
                    {score.score.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
