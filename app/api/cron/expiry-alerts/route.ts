import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { expiryEmailTemplate } from "@/lib/email/templates";
import { getResendClient } from "@/lib/email/resend";
import { addDaysUTC, formatIsoDateForLocale, toIsoDateUTC } from "@/lib/expiry-alerts";

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
    .eq("notified_14d", false);

  const { data: exp1 } = await admin
    .from("expiry_items")
    .select("id,vehicle_id,type,expiry_date,notified_1d")
    .eq("expiry_date", iso1)
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
    .select("id,user_id,license_plate")
    .in("id", vehicleIds);

  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const userIds = Array.from(new Set((vehicles ?? []).map((v) => v.user_id)));

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,email,email_notifications,preferred_language")
    .in("id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const item of candidates) {
    const veh = vehicleById.get(item.vehicle_id);
    if (!veh) continue;

    const profile = profileById.get(veh.user_id);
    if (!profile?.email) continue;
    if (profile.email_notifications === false) continue;

    const lang = (profile.preferred_language ?? "en") as "en" | "hu" | "ro";
    const date = formatIsoDateForLocale(String(item.expiry_date), lang);
    const tpl = expiryEmailTemplate(lang, {
      license_plate: String(veh.license_plate),
      type: String(item.type),
      date,
    });

    const result = await resend.emails.send({
      from,
      to: profile.email,
      subject: tpl.subject,
      text: tpl.text,
    });

    if (result.error) continue;

    if (item.kind === "14d") {
      await admin.from("expiry_items").update({ notified_14d: true }).eq("id", item.id);
    } else {
      await admin.from("expiry_items").update({ notified_1d: true }).eq("id", item.id);
    }

    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}

