import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserWithRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { inviteEmailTemplate } from "@/lib/email/templates";
import { getResendClient } from "@/lib/email/resend";
import { generateInviteToken, hashInviteToken, inviteExpiryIso } from "@/lib/invite";

const bodySchema = z.object({
  email: z.string().email(),
  lang: z.enum(["en", "hu", "ro"]).optional(),
});

function isAuthorized(req: Request) {
  const secret = process.env.INVITE_ADMIN_TOKEN;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  return token === secret;
}

export async function POST(req: Request) {
  const current = await getCurrentUserWithRole();
  const isAdmin = current?.role === "admin";

  // Allow either an authenticated admin OR a server-to-server bearer secret.
  if (!isAdmin && !isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const lang = parsed.data.lang ?? "en";
  const rawToken = generateInviteToken();
  const token = hashInviteToken(rawToken);
  const expires_at = inviteExpiryIso(72);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("invites").insert({
    email,
    token,
    expires_at,
    used: false,
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
      // Ignore email failures; admin can still copy the token from UI.
    }
  }

  return NextResponse.json({
    email,
    token: rawToken,
    expires_at,
  });
}

function getRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

