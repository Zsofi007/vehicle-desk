"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const langSchema = z.object({
  preferred_language: z.enum(["en", "hu", "ro"]),
});

const notificationsSchema = z.object({
  email_notifications: z.boolean(),
});

export async function updatePreferredLanguage(
  preferred_language: "en" | "hu" | "ro",
) {
  const parsed = langSchema.safeParse({ preferred_language });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: parsed.data.preferred_language })
    .eq("id", user.id);

  if (error) return { error: "error" as const };
  return { ok: true as const };
}

export async function updateEmailNotifications(
  email_notifications: boolean,
) {
  const parsed = notificationsSchema.safeParse({ email_notifications });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { error } = await supabase
    .from("profiles")
    .update({ email_notifications: parsed.data.email_notifications })
    .eq("id", user.id);

  if (error) return { error: "error" as const };
  return { ok: true as const };
}

