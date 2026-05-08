import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { odometerReminderEmailTemplate } from "@/lib/email/templates";
import { getPublicBaseUrl } from "@/lib/email/base-url";
import { getResendClient } from "@/lib/email/resend";
import { hashSecret, hitRateLimit } from "@/lib/rate-limit";
import { getCarLogoSrc } from "@/lib/car-logos";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  return token === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const rawToken = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const tokenHash = rawToken ? hashSecret(rawToken) : "missing";
  const rl = await hitRateLimit({
    scope: "cron_odometer_reminders",
    key: `cron:${tokenHash}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    const retryAfter = Math.max(
      0,
      Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const admin = createSupabaseAdminClient();
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return NextResponse.json({ error: "missing_from" }, { status: 500 });
  }

  const staleDays = 90;
  const cooldownDays = 30;
  const now = new Date();
  const staleBefore = new Date(now);
  staleBefore.setUTCDate(staleBefore.getUTCDate() - staleDays);
  const cooldownBefore = new Date(now);
  cooldownBefore.setUTCDate(cooldownBefore.getUTCDate() - cooldownDays);

  const { data: vehicles } = await admin
    .from("vehicles")
    .select(
      "id,user_id,license_plate,make,model,year,last_odometer_update_at,last_odometer_reminder_sent_at",
    )
    .lt("last_odometer_update_at", staleBefore.toISOString())
    .or(
      `last_odometer_reminder_sent_at.is.null,last_odometer_reminder_sent_at.lt.${cooldownBefore.toISOString()}`,
    );

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = Array.from(new Set(vehicles.map((v: any) => String(v.user_id))));
  const { data: profiles } = await admin
    .from("profiles")
    .select("id,email,email_notifications,preferred_language")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p: any) => [String(p.id), p]));

  const origin = getPublicBaseUrl(req);
  let sent = 0;

  for (const v of vehicles as any[]) {
    const profile = profileById.get(String(v.user_id));
    if (!profile?.email) continue;
    if (profile.email_notifications === false) continue;

    const lang = (profile.preferred_language ?? "en") as "en" | "hu" | "ro";
    const quickUrl = `${origin}/${lang}/vehicles/${String(v.id)}/quick-odometer`;
    const logoSrc = v.make ? getCarLogoSrc(String(v.make)) : null;
    const logoUrl = logoSrc ? `${origin}${logoSrc}` : null;
    const tpl = odometerReminderEmailTemplate(lang, {
      license_plate: String(v.license_plate ?? ""),
      make: String(v.make ?? ""),
      model: String(v.model ?? ""),
      year: Number(v.year ?? 0),
      logoUrl,
      quickUrl,
    });

    const result = await resend.emails.send({
      from,
      to: profile.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });

    if (result.error) continue;

    await admin
      .from("vehicles")
      .update({ last_odometer_reminder_sent_at: now.toISOString() })
      .eq("id", v.id);

    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}

