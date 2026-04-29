import type { User } from "@supabase/supabase-js";

import { redirect } from "@/lib/navigation";
import type { AppLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "user";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth(locale: AppLocale): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  return user!;
}

export async function getCurrentUserWithRole(): Promise<{
  user: User;
  role: UserRole;
} | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role === "admin" ? "admin" : "user") as UserRole;
  return { user, role };
}

