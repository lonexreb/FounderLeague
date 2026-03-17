"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/utils";
import { Plus, X } from "lucide-react";

export function CreateLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [maxMembers, setMaxMembers] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
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

    const inviteCode = type !== "public" ? generateInviteCode() : null;

    const { data: league, error: createError } = await supabase
      .from("leagues")
      .insert({
        name,
        type,
        max_members: maxMembers,
        created_by: user.id,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    // Auto-join the creator
    await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
      display_name:
        user.user_metadata?.display_name || user.email?.split("@")[0],
    });

    setOpen(false);
    setName("");
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create League
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create a League</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  League Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. YC Batch W26"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "public" | "private")
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private (invite code)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Max Members
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : "Create League"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
