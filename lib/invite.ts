import "server-only";

import crypto from "crypto";

export type InviteRow = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function inviteExpiryIso(hours = 72): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

