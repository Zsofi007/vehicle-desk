"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "@/lib/navigation";
import type { AppLocale } from "@/lib/i18n";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthActionState = {
  error?: string;
};

export async function signIn(
  _prev: AuthActionState | undefined,
  formData: FormData,
) {
  const locale = String(formData.get("locale") ?? "en") as AppLocale;
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: "user",
        preferred_language: locale,
      });
    }

    const preferred =
      (profile?.preferred_language as AppLocale | undefined) ?? locale ?? "en";
    redirect({ href: "/dashboard", locale: preferred });
  }

  redirect({ href: "/dashboard", locale });
}

export async function signOut(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en") as AppLocale;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect({ href: "/login", locale });
}
