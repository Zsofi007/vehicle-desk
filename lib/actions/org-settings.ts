"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
});

export async function updateOrganizationName(name: string) {
  const parsed = schema.safeParse({ name });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const orgId = profile?.active_organization_id ? String(profile.active_organization_id) : null;
  if (!orgId) return { error: "unauthorized" as const };

  const value = parsed.data.name;
  const normalized = value && value.length > 0 ? value : null;
  if (!normalized) return { error: "validation" as const };

  const { error } = await supabase
    .from("organizations")
    .update({ name: normalized })
    .eq("id", orgId);

  if (error) return { error: "forbidden" as const };
  return { ok: true as const };
}

