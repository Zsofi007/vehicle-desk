import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserWithRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateInviteToken, hashInviteToken, inviteExpiryIso } from "@/lib/invite";

const bodySchema = z.object({
  email: z.string().email(),
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

  // Note: token is returned once. Store/send it via email in production.
  return NextResponse.json({
    email,
    token: rawToken,
    expires_at,
  });
}

