import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashInviteToken } from "@/lib/invite";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/\d/),
  token: z.string().min(10),
  companyName: z.string().trim().max(120).optional(),
});

function genericError() {
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}

function debugError(reason: string) {
  if (process.env.NODE_ENV === "production") return genericError();
  return NextResponse.json({ error: "invalid", reason }, { status: 400 });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await hitRateLimit({
    scope: "signup",
    key: ip,
    limit: 5,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    const retryAfter = Math.max(0, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return debugError("validation");
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const tokenHash = hashInviteToken(parsed.data.token.trim());
  const companyNameRaw = parsed.data.companyName;
  const company_name =
    companyNameRaw && companyNameRaw.length > 0 ? companyNameRaw : null;

  const admin = createSupabaseAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from("invites")
    .select("*")
    .eq("token", tokenHash)
    .maybeSingle();

  if (inviteError) return debugError("invite_lookup_failed");
  if (!invite) return debugError("invite_not_found");
  if (invite.used) return debugError("invite_used");
  if (String(invite.email).trim().toLowerCase() !== email) return debugError("invite_email_mismatch");
  if (new Date(invite.expires_at).getTime() <= Date.now()) return debugError("invite_expired");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) return debugError(`create_user_failed:${createError.message}`);

  const userId = created?.user?.id ?? null;
  if (!userId) return debugError("create_user_missing_id");

  const inviteOrgId = invite.organization_id ? String(invite.organization_id) : null;

  // If the invite targets an existing organization, join it as a member.
  // Otherwise, create a default org for the new user (id = user id) and make them the owner.
  const organizationId = inviteOrgId ?? userId;

  if (!inviteOrgId) {
    const orgName =
      company_name && String(company_name).trim().length > 0
        ? String(company_name).trim()
        : email.split("@")[0] || email;

    const { error: orgError } = await admin.from("organizations").insert({
      id: organizationId,
      name: orgName,
    });
    if (orgError) return debugError(`create_org_failed:${orgError.message}`);
  }

  const { error: memError } = await admin.from("organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    role: inviteOrgId ? "member" : "owner",
  });
  if (memError) return debugError(`create_membership_failed:${memError.message}`);

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
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    role,
    company_name,
    active_organization_id: organizationId,
  });
  if (profileError) return debugError(`create_profile_failed:${profileError.message}`);

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

