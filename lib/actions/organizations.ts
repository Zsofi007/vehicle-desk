"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  organizationId: z.string().uuid(),
});

export async function setActiveOrganization(organizationId: string) {
  const parsed = schema.safeParse({ organizationId });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  // Ensure the user is a member of the organization they’re switching to.
  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();
  if (memError) return { error: "error" as const };
  if (!membership) return { error: "forbidden" as const };

  const { error } = await supabase
    .from("profiles")
    .update({ active_organization_id: parsed.data.organizationId })
    .eq("id", user.id);
  if (error) return { error: "error" as const };
  return { ok: true as const };
}

