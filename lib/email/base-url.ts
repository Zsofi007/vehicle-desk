import "server-only";

/**
 * Email assets (images/links) must use a publicly reachable absolute URL.
 *
 * - In Vercel, `VERCEL_URL` is available (without protocol).
 * - Locally, `req` origin is usually `http://localhost:*` (not reachable from email clients).
 *   Use `PUBLIC_APP_URL` to override for local testing (e.g. a Vercel Preview URL).
 */
export function getPublicBaseUrl(req: Request): string {
  const explicit = (process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = (process.env.VERCEL_URL ?? "").trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`.replace(/\/+$/, "");
}

