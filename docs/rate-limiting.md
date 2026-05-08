# Rate limiting

Vehicle Desk uses a **Postgres-backed**, Vercel-compatible rate limiter to reduce abuse on sensitive endpoints (signup, invites, cron, and login). It is intentionally lightweight and avoids Redis or heavy infrastructure.

## What is rate-limited

The current default limits are **per minute**:

- **Signup**: `POST /api/auth/signup` → **5/min per IP**
- **Invites**: `POST /api/invite` → **10/min per IP**
- **Login**: server action `signIn` → **10/min per IP** (best-effort)
- **Cron**: `POST /api/cron/expiry-alerts` → **60/min per secret**

If exceeded:
- API routes return **HTTP 429** and include `Retry-After`.
- Login returns a generic error (`rate_limited`) and the UI shows a localized “try again later” message.

## How it works (high level)

1. The app computes a **rate-limit key** (usually the client IP).
2. It calls a single Postgres function: `app_private.rate_limit_hit(...)`.
3. The function does an **atomic upsert** into a bucketed counter table.
4. The function returns whether the request is **allowed**, how many are **remaining**, and when the bucket **resets**.

All counters are stored in `public.rate_limits` with a unique constraint on:

- `scope` (e.g. `signup`, `invite`)
- `key` (e.g. IP, or `cron:<sha256(token)>`)
- `bucket_start` (window start timestamp)

## Why Postgres + SECURITY DEFINER (and not in-memory)

Vercel runs multiple serverless instances and can cold-start at any time.

- **In-memory limiting** is best-effort only:
  - doesn’t work reliably across instances/regions
  - resets on cold starts
- **Postgres-backed limiting** works consistently because all instances share the same database.

The core limiter is implemented as a **`SECURITY DEFINER` function** so we can:

- keep `public.rate_limits` **locked down** (no direct writes from `anon`/`authenticated`)
- guarantee **atomic increments** inside the database
- keep the app code simple (single RPC call)

## Keying strategy

### IP (default)
For public endpoints we use proxy headers (best-effort):

- `x-forwarded-for` (first IP)
- `x-real-ip`
- `cf-connecting-ip`

If none are present, the key falls back to `unknown`.

### Cron secrets
For cron we rate-limit by the bearer token, but **never store the raw token**:

- key is `cron:` + `sha256(token)`

## Operational notes

### Fail-open behavior
If the RPC fails (misconfiguration, migration not applied, temporary DB issue), the limiter **fails open** and allows the request. This prevents accidental lockouts during deploys.

### Retention / cleanup
The migration includes a helper function:

- `app_private.rate_limit_prune(p_older_than interval)`

This can be run manually or scheduled later (e.g. Supabase scheduled job) to prevent unbounded growth.

## Where the code lives

- Migration: `supabase/migrations/20260508114500_rate_limiting.sql`
- Server helper: `lib/rate-limit.ts`
- Applied in:
  - `app/api/auth/signup/route.ts`
  - `app/api/invite/route.ts`
  - `app/api/cron/expiry-alerts/route.ts`
  - `lib/actions/auth.ts` (`signIn`)

