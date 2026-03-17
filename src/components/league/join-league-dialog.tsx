"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, X } from "lucide-react";

export function JoinLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Find league by invite code
    const { data: league, error: findError } = await supabase
      .from("leagues")
      .select("id, name, max_members")
      .eq("invite_code", inviteCode.toUpperCase().trim())
      .single();

    if (findError || !league) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    // Check member count
    const { count } = await supabase
      .from("league_members")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id);

    if (count && count >= league.max_members) {
      setError("This league is full");
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      setError("You're already in this league");
      setLoading(false);
      return;
    }

    const { error: joinError } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
      display_name:
        user.user_metadata?.display_name || user.email?.split("@")[0],
    });

    if (joinError) {
      setError(joinError.message);
      setLoading(false);
      return;
    }

    setOpen(false);
    setInviteCode("");
    setLoading(false);
    router.push(`/leagues/${league.id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Join with Code
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Join a League</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white uppercase tracking-widest placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="ABCD1234"
                  maxLength={8}
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Joining..." : "Join League"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
