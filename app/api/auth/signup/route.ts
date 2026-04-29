import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashInviteToken } from "@/lib/invite";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/\d/),
  token: z.string().min(10),
});

function genericError() {
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return genericError();
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const tokenHash = hashInviteToken(parsed.data.token.trim());

  const admin = createSupabaseAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from("invites")
    .select("*")
    .eq("token", tokenHash)
    .maybeSingle();

  if (inviteError || !invite) return genericError();
  if (invite.used) return genericError();
  if (String(invite.email).trim().toLowerCase() !== email) return genericError();
  if (new Date(invite.expires_at).getTime() <= Date.now()) return genericError();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) return genericError();

  // Create profile with default role. Safeguards:
  // - If ADMIN_EMAIL is set and matches, user becomes admin.
  // - If no admin exists yet, first registered user becomes admin.
  const desiredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdminEmail = desiredAdminEmail && desiredAdminEmail === email;
  const { count: adminCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const role = isAdminEmail || (adminCount ?? 0) === 0 ? "admin" : "user";
  if (created?.user?.id) {
    await admin.from("profiles").insert({
      id: created.user.id,
      email,
      role,
    });
  }

  // Consume invite (best-effort, but prevents reuse under normal circumstances).
  await admin
    .from("invites")
    .update({ used: true })
    .eq("id", invite.id)
    .eq("used", false);

  // Create a session cookie by signing in via the SSR client.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Account exists but session creation failed; keep response generic.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

