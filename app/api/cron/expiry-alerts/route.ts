import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { expiryEmailTemplate } from "@/lib/email/templates";
import { getResendClient } from "@/lib/email/resend";
import { addDaysUTC, formatIsoDateForLocale, toIsoDateUTC } from "@/lib/expiry-alerts";
import { hashSecret, hitRateLimit } from "@/lib/rate-limit";
import { getCarLogoSrc } from "@/lib/car-logos";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  return token === secret;
}

async function runExpiryAlerts(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const rawToken = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const tokenHash = rawToken ? hashSecret(rawToken) : "missing";
  const rl = await hitRateLimit({
    scope: "cron_expiry_alerts",
    key: `cron:${tokenHash}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    const retryAfter = Math.max(0, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
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

  const today = new Date();
  const iso14 = toIsoDateUTC(addDaysUTC(today, 14));
  const iso1 = toIsoDateUTC(addDaysUTC(today, 1));

  const { data: exp14 } = await admin
    .from("expiry_items")
    .select("id,vehicle_id,type,expiry_date,notified_14d")
    .eq("expiry_date", iso14)
    .eq("is_active", true)
    .eq("notified_14d", false);

  const { data: exp1 } = await admin
    .from("expiry_items")
    .select("id,vehicle_id,type,expiry_date,notified_1d")
    .eq("expiry_date", iso1)
    .eq("is_active", true)
    .eq("notified_1d", false);

  const candidates = [
    ...(exp14 ?? []).map((x) => ({ ...x, kind: "14d" as const })),
    ...(exp1 ?? []).map((x) => ({ ...x, kind: "1d" as const })),
  ];

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const vehicleIds = Array.from(new Set(candidates.map((c) => c.vehicle_id)));
  const { data: vehicles } = await admin
    .from("vehicles")
    .select("id,user_id,license_plate,make,model,year")
    .in("id", vehicleIds);

  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const userIds = Array.from(new Set((vehicles ?? []).map((v) => v.user_id)));

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,email,email_notifications,preferred_language")
    .in("id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  const itemsByVehicleId = new Map<string, typeof candidates>();
  for (const item of candidates) {
    const arr = itemsByVehicleId.get(item.vehicle_id) ?? [];
    arr.push(item);
    itemsByVehicleId.set(item.vehicle_id, arr);
  }

  for (const [vehicleId, items] of itemsByVehicleId.entries()) {
    const veh = vehicleById.get(vehicleId);
    if (!veh) continue;

    const profile = profileById.get(veh.user_id);
    if (!profile?.email) continue;
    if (profile.email_notifications === false) continue;

    const lang = (profile.preferred_language ?? "en") as "en" | "hu" | "ro";
    const origin = getRequestOrigin(req);
    const vehicleUrl = `${origin}/${lang}/vehicles/${vehicleId}`;
    const logoSrc = veh.make ? getCarLogoSrc(String(veh.make)) : null;
    const logoUrl = logoSrc ? `${origin}${logoSrc}` : null;
    const templateItems = items
      .map((it) => ({
        type: String(it.type),
        date: formatIsoDateForLocale(String(it.expiry_date), lang),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tpl = expiryEmailTemplate(lang, {
      license_plate: String(veh.license_plate),
      make: String((veh as { make?: string | null }).make ?? ""),
      model: String((veh as { model?: string | null }).model ?? ""),
      year: Number((veh as { year?: number | null }).year ?? 0),
      logoUrl,
      items: templateItems,
      vehicleUrl,
    });

    const result = await resend.emails.send({
      from,
      to: profile.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });

    if (result.error) continue;

    const ids14 = items.filter((x) => x.kind === "14d").map((x) => x.id);
    const ids1 = items.filter((x) => x.kind === "1d").map((x) => x.id);
    if (ids14.length > 0) {
      await admin.from("expiry_items").update({ notified_14d: true }).in("id", ids14);
    }
    if (ids1.length > 0) {
      await admin.from("expiry_items").update({ notified_1d: true }).in("id", ids1);
    }

    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}

/** Vercel Cron invokes GET; manual triggers may use POST. */
export async function GET(req: Request) {
  return runExpiryAlerts(req);
}

export async function POST(req: Request) {
  return runExpiryAlerts(req);
}

function getRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

