import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserWithRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { inviteEmailTemplate } from "@/lib/email/templates";
import { getResendClient } from "@/lib/email/resend";
import { generateInviteToken, hashInviteToken, inviteExpiryIso } from "@/lib/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  lang: z.enum(["en", "hu", "ro"]).optional(),
  organizationId: z.string().uuid().optional(),
});

function isAuthorized(req: Request) {
  const secret = process.env.INVITE_ADMIN_TOKEN;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  return token === secret;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await hitRateLimit({
    scope: "invite",
    key: ip,
    limit: 10,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    const retryAfter = Math.max(0, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const current = await getCurrentUserWithRole();
  const isAdmin = current?.role === "admin";

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const lang = parsed.data.lang ?? "en";
  const requestedOrgId = parsed.data.organizationId ?? null;
  const rawToken = generateInviteToken();
  const token = hashInviteToken(rawToken);
  const expires_at = inviteExpiryIso(72);

  let organization_id: string | null = null;
  if (isAuthorized(req) && !isAdmin) {
    // Server-to-server invites must be explicit about the target organization.
    if (!requestedOrgId) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    organization_id = requestedOrgId;
  } else {
    // Session-based: use the caller's active organization and verify org admin role.
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Overall admins can only invite new org owners:
    // - invite has no organization_id
    // - signup creates a new org and makes the user owner
    if (isAdmin) {
      organization_id = null;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("id", user.id)
        .maybeSingle();
      const activeOrgId = profile?.active_organization_id
        ? String(profile.active_organization_id)
        : null;
      if (!activeOrgId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", activeOrgId)
        .maybeSingle();
      const role = String(membership?.role ?? "");
      const isOrgAdmin = role === "owner" || role === "admin";
      if (!isOrgAdmin) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      organization_id = activeOrgId;
    }
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("invites").insert({
    email,
    token,
    expires_at,
    used: false,
    organization_id,
  });

  if (error) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }

  // Send invite email (best-effort). Token is also returned once for admin UI.
  const from = process.env.RESEND_FROM_EMAIL;
  const origin = getRequestOrigin(req);
  if (from) {
    try {
      const resend = getResendClient();
      const signupUrl = `${origin}/${lang}/signup?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`;
      const tpl = inviteEmailTemplate({ toEmail: email, signupUrl, lang });
      await resend.emails.send({
        from,
        to: email,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });
    } catch {
      // Ignore email failures; global admins can still copy the token from the API response.
    }
  }

  // Only global admins receive the raw token in the response. Org admins rely on email.
  return NextResponse.json({
    email,
    ...(isAdmin ? { token: rawToken } : {}),
    expires_at,
  });
}

function getRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

