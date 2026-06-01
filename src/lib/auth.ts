import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string;
  username: string;
  memberLevel: number;
}

/** Current signed-in user + profile from Supabase (null if logged out). */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, member_level")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    username:
      profile?.username ??
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0] ??
      "user",
    memberLevel: profile?.member_level ?? 1,
  };
}
