"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { League } from "@/types";
import { Globe, Lock, Users, Copy, LogOut, Check } from "lucide-react";

interface Props {
  league: League;
  isMember: boolean;
  memberCount: number;
  userId: string;
}

export function LeagueHeader({ league, isMember, memberCount, userId }: Props) {
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCopyInvite() {
    if (!league.invite_code) return;
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    const { error } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: userId,
    });
    if (!error) router.refresh();
  }

  async function handleLeave() {
    setLeaving(true);
    await supabase
      .from("league_members")
      .delete()
      .eq("league_id", league.id)
      .eq("user_id", userId);
    router.push("/leagues");
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{league.name}</h1>
          {league.type === "public" ? (
            <Globe className="h-5 w-5 text-slate-500" />
          ) : (
            <Lock className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {memberCount}/{league.max_members} members
          </span>
          <span className="capitalize">{league.type} league</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {league.invite_code && isMember && (
          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : league.invite_code}
          </button>
        )}

        {isMember ? (
          <button
            onClick={handleLeave}
            disabled={leaving || league.created_by === userId}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-rose-500 hover:text-rose-400 disabled:opacity-50 transition-colors"
            title={
              league.created_by === userId
                ? "Creator cannot leave"
                : "Leave league"
            }
          >
            <LogOut className="h-4 w-4" />
            Leave
          </button>
        ) : (
          league.type === "public" && (
            <button
              onClick={handleJoin}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Join League
            </button>
          )
        )}
      </div>
    </div>
  );
}
