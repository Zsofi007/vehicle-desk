import "server-only";

import crypto from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RateLimitScope =
  | "signup"
  | "invite"
  | "login"
  | "cron_expiry_alerts";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

function firstIpFromXForwardedFor(header: string) {
  const first = header.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return firstIpFromXForwardedFor(xff) ?? "unknown";

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) return cfIp.trim();

  return "unknown";
}

export function getClientIpFromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return firstIpFromXForwardedFor(xff) ?? "unknown";

  const realIp = h.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();

  const cfIp = h.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) return cfIp.trim();

  return "unknown";
}

export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export async function hitRateLimit(params: {
  scope: RateLimitScope;
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("rate_limit_hit", {
    p_scope: params.scope,
    p_key: params.key,
    p_limit: params.limit,
    p_window_seconds: params.windowSeconds,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    // Fail-open: do not block if limiter is misconfigured.
    return { allowed: true, remaining: params.limit, resetAt: new Date(Date.now() + params.windowSeconds * 1000) };
  }

  const row = data[0] as {
    allowed: boolean;
    remaining: number;
    reset_at: string;
  };

  return {
    allowed: Boolean(row.allowed),
    remaining: Number(row.remaining),
    resetAt: new Date(row.reset_at),
  };
}

