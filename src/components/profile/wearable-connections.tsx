"use client";

import type { WearableConnection } from "@/types";
import { Activity, Link2, Unlink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  connections: WearableConnection[];
  userId: string;
}

const WEARABLES = [
  {
    provider: "oura" as const,
    name: "Oura Ring",
    description: "Readiness, sleep, and activity tracking",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/10",
  },
  {
    provider: "whoop" as const,
    name: "Whoop",
    description: "Recovery, strain, and sleep tracking",
    color: "text-blue-400",
    bgColor: "bg-blue-600/10",
  },
];

export function WearableConnections({ connections, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  function getConnection(provider: string) {
    return connections.find((c) => c.provider === provider);
  }

  function handleConnect(provider: string) {
    // Redirect to OAuth flow
    window.location.href = `/api/connect/${provider}`;
  }

  async function handleDisconnect(provider: string) {
    await supabase
      .from("wearable_connections")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-lg font-semibold">Connected Wearables</h2>
      <p className="mt-1 text-sm text-slate-400">
        Connect your wearable to sync health data
      </p>

      <div className="mt-6 space-y-4">
        {WEARABLES.map((wearable) => {
          const connection = getConnection(wearable.provider);
          return (
            <div
              key={wearable.provider}
              className="flex items-center justify-between rounded-lg border border-slate-800 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${wearable.bgColor} p-2`}>
                  <Activity className={`h-5 w-5 ${wearable.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{wearable.name}</p>
                  <p className="text-xs text-slate-400">
                    {connection
                      ? `Connected ${new Date(connection.connected_at).toLocaleDateString()}`
                      : wearable.description}
                  </p>
                </div>
              </div>

              {connection ? (
                <button
                  onClick={() => handleDisconnect(wearable.provider)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-rose-500 hover:text-rose-400 transition-colors"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(wearable.provider)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
