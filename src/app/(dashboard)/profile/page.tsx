export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { WearableConnections } from "@/components/profile/wearable-connections";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: connections } = await supabase
    .from("wearable_connections")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-slate-400">
        Manage your account and connected wearables
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ProfileForm
          profile={profile}
          email={user.email || ""}
          userId={user.id}
        />
        <WearableConnections
          connections={connections || []}
          userId={user.id}
        />
      </div>
    </div>
  );
}
