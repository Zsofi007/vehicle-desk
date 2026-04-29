import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;

export function getResendClient() {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY.");
  cached = new Resend(key);
  return cached;
}

