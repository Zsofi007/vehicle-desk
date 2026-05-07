import type { User } from "@supabase/supabase-js";

import { redirect } from "@/lib/navigation";
import type { AppLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "user";

export type OrganizationRole = "owner" | "admin" | "member";

export type UserOrganization = {
  id: string;
  name: string;
  role: OrganizationRole;
};

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

export async function getOrganizationsForUser(
  userId: string,
): Promise<UserOrganization[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations (
        id,
        name
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  type Row = {
    role: OrganizationRole | string;
    organization: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  };

  return (data ?? [])
    .map((row: Row) => {
      const org = Array.isArray(row.organization) ? row.organization[0] : row.organization;
      if (!org?.id) return null;
      const role: OrganizationRole =
        row.role === "owner" || row.role === "admin" || row.role === "member"
          ? row.role
          : "member";
      return {
        id: org.id,
        name: org.name ?? "",
        role,
      };
    })
    .filter((x): x is UserOrganization => Boolean(x));
}

export async function getActiveOrganizationIdForUser(
  userId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  const raw = profile?.active_organization_id;
  return raw ? String(raw) : null;
}

/**
 * Resolve an active org for the current user.
 * - If profile has a valid active org id (user is a member), return it.
 * - Else pick the first membership by name and persist it best-effort.
 */
export async function requireActiveOrganization(
  locale: AppLocale,
): Promise<{ user: User; organization: UserOrganization }> {
  const user = await requireAuth(locale);
  const orgs = await getOrganizationsForUser(user.id);
  if (orgs.length === 0) {
    // No org membership means the account isn't properly provisioned.
    redirect({ href: "/login", locale });
  }

  const preferred = await getActiveOrganizationIdForUser(user.id);
  const preferredOrg = preferred ? orgs.find((o) => o.id === preferred) : null;

  const selected =
    preferredOrg ??
    [...orgs].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))[0]!;

  if (!preferredOrg) {
    const supabase = await createSupabaseServerClient();
    // Best-effort: avoid blocking page loads if profile update fails.
    await supabase
      .from("profiles")
      .update({ active_organization_id: selected.id })
      .eq("id", user.id);
  }

  return { user, organization: selected };
}

export async function getPreferredLocaleForUser(
  userId: string,
): Promise<AppLocale | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .maybeSingle();

  const raw = String(profile?.preferred_language ?? "").toLowerCase();
  if (raw === "hu" || raw === "ro" || raw === "en") return raw;
  return null;
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

