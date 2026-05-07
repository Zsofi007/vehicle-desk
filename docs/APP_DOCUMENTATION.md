# Vehicle Desk — Application Documentation

This document describes the Vehicle Desk application from a “new engineer / auditor” perspective: features, user journeys, architecture, data model, and operational concerns.

## Product summary

Vehicle Desk is an invite-only, multi-tenant web app for tracking:

- Vehicles (per user/tenant)
- Maintenance records per vehicle
- Expiry/renewal items (insurance, inspection, vignette/rovinietă, etc.)
- Alerts for expired / expiring soon items
- Automated email reminders (cron)

It supports multiple locales (`/en`, `/hu`, `/ro`) and persists each user’s preferred language.

## Tech stack

- **Next.js App Router** (Next 16.x) + **React**
- **Supabase**: Auth + Postgres with **Row Level Security (RLS)**
- **next-intl**: i18n + locale-prefixed routing
- **Resend**: transactional email delivery
- Tailwind CSS + Radix/shadcn-style UI primitives

## High-level architecture

### Runtime boundaries

- **Server components/pages**: render most pages and fetch data via Supabase SSR client.
- **Client components**: forms and interactive UI (modals, inline editors, toggles).
- **Server Actions** (`"use server"`): used for authenticated mutations (e.g. profile settings, expiry CRUD, auth sign-in).
- **API routes**: used for workflows requiring service role / external auth (invite-only signup, invite creation endpoint, cron job).

### Tenancy model

Tenancy is enforced in Postgres using **RLS**:

- A user can only access vehicles where `vehicles.user_id = auth.uid()`.
- Child rows (`maintenance_records`, `expiry_items`) are accessible only if their `vehicle_id` belongs to a vehicle owned by `auth.uid()`.
- `invites` is **service-role only** (RLS denies anon/authenticated).

## Routing and pages

All UI routes are **locale-prefixed**: `/{locale}/...` where locale ∈ `{en, hu, ro}`.

### Public/auth pages

- `/{locale}`: redirect
  - if authenticated → `/{preferred-locale}/dashboard`
  - else → `/{locale}/login`
- `/{locale}/login`: email/password login
- `/{locale}/signup`: invite-based signup (email + password + invite token, optional company name)

Auth section layout redirects authenticated users to the dashboard.

### Authenticated application pages

Authenticated routes are under the “app section” layout:

- `/{locale}/dashboard`
  - Vehicle count
  - Alerts count (expired + expiring soon)
  - Upcoming expiries (next 7 days)
  - Alerts table linking to vehicle detail
- `/{locale}/vehicles`
  - Vehicle tiles list + filtering/sorting
  - Status badges derived from expiry alert status
  - Add vehicle entry point (modal + floating action button)
- `/{locale}/vehicles/[id]`
  - Vehicle header with edit/delete
  - Maintenance section (add + editable list)
  - Expiry section (add + editable list)
- `/{locale}/settings`
  - Company name (shown in sidebar subtitle)
  - Preferred language (persisted; layout redirects to match it)
  - Email notification toggle (affects cron email sends)
- `/{locale}/admin/invites` (admin-only)
  - Create invites + list recent invites

## Core user flows

### Flow A — Invite creation (admin)

1. Admin navigates to `/{locale}/admin/invites`.
2. Submits invite form with email + language.
3. `POST /api/invite`:
   - Authorization:
     - either authenticated user with `profiles.role = 'admin'`
     - **or** server-to-server `Authorization: Bearer $INVITE_ADMIN_TOKEN`
   - Creates invite in `public.invites` with:
     - hashed token (unique)
     - `expires_at` (typically 72h)
     - `used=false`
   - Sends invite email via Resend (best-effort).
   - Returns the **raw token once** for admin UI copy/paste.

### Flow B — Invite-based signup

1. User opens signup link containing `email` and raw `token`.
2. Signup form posts to `POST /api/auth/signup`.
3. Server verifies:
   - invite exists, not used, not expired
   - invite email matches the signup email
4. Server creates Supabase Auth user using **service role**.
5. Server creates `profiles` row for the new user:
   - role is `admin` if:
     - `ADMIN_EMAIL` matches the user email, or
     - there are no admins yet (bootstrap)
   - `company_name` optional
6. Marks invite as used (best-effort).
7. Signs user in via Supabase SSR client to set session cookies.

### Flow C — Day-to-day usage

- Users create vehicles.
- For each vehicle they maintain:
  - maintenance records (dated, odometer, notes)
  - expiry items (type, expiry date, cost)
- Dashboard derives “expired” / “expiring soon” status from expiry dates.

### Flow D — Daily email reminders (cron)

1. Vercel Cron (or any scheduler) calls `POST /api/cron/expiry-alerts`
   with `Authorization: Bearer $CRON_SECRET`.
2. Server finds candidate expiry items:
   - expiring exactly 14 days from “today” (UTC calendar date), not notified
   - expiring exactly 1 day from “today” (UTC calendar date), not notified
   - only where `is_active = true`
3. Server loads vehicles and profiles for those items.
4. Skips users with `email_notifications = false`.
5. Sends one email per vehicle containing all candidate items for that vehicle.
6. Updates `notified_14d` / `notified_1d` to prevent duplicate emails.

## Date and alert semantics

Expiry comparisons are based on **UTC calendar dates** (`YYYY-MM-DD`):

- “Expired”: expiry date is before today (UTC date string comparison via helper logic)
- “Expiring soon”: expiry date between today and today+7 days (inclusive)
- Cron reminders: exact matches for today+14 and today+1 (UTC calendar dates)

If you change this to user-local time semantics, update both UI comparisons and cron logic together.

## API surface

### `POST /api/invite`

Creates an invite. Requires one of:

- authenticated `admin`, or
- `Authorization: Bearer $INVITE_ADMIN_TOKEN`

Body:

- `email`: string (required)
- `lang`: `"en" | "hu" | "ro"` (optional)

Returns (success):

- `email`
- `token` (raw, only returned once)
- `expires_at`

### `POST /api/auth/signup`

Creates an account using an invite token (service role).

Body:

- `email`: string
- `password`: string (min 8 chars, must contain a digit)
- `token`: string (raw invite token)
- `companyName`: string (optional)

Returns:

- `{ ok: true }` on success (generic responses are used to avoid leaking details)

### `POST /api/cron/expiry-alerts`

Sends reminder emails for expiries at 14 days and 1 day before expiry.

Headers:

- `Authorization: Bearer $CRON_SECRET`

Returns:

- `{ ok: true, sent: number }`

## Database schema (Supabase)

This is the logical model derived from `supabase/migrations/*`.

### `public.vehicles`

- `id uuid pk`
- `user_id uuid → auth.users(id)` (tenant boundary)
- `make text`, `model text`, `year int`, `license_plate text`, `odometer int`
- `vehicle_type text` (constrained by check constraint)
- `created_at timestamptz`

### `public.maintenance_records`

- `id uuid pk`
- `vehicle_id uuid → public.vehicles(id)`
- `type text`, `date date`, `odometer int`, `notes text?`

### `public.expiry_items`

- `id uuid pk`
- `vehicle_id uuid → public.vehicles(id)`
- `type text`, `expiry_date date`, `cost numeric(12,2)?`
- `is_active boolean` + `negated_at timestamptz?` (history/soft-replace pattern)
- `notified_14d boolean`, `notified_1d boolean`

### `public.profiles`

- `id uuid pk → auth.users(id)`
- `email text?`
- `role text` (convention: `admin` or `user`)
- `preferred_language text` (defaults to `ro`)
- `email_notifications boolean` (defaults to true)
- `company_name text?`
- `created_at timestamptz`

### `public.invites` (service-role only)

- `id uuid pk`
- `email text`
- `token text unique` (hashed)
- `expires_at timestamptz`
- `used boolean`
- `created_at timestamptz`

## Environment variables

See `.env.example` / `README.md` for the canonical list. Key values:

- **Client + server (safe to expose)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Server-only secrets**:
  - `SUPABASE_SERVICE_ROLE_KEY` (required for invite-only signup + cron data access)
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (email sending)
  - `CRON_SECRET` (protects cron endpoint)
  - `INVITE_ADMIN_TOKEN` (optional server-to-server invite creation)
  - `ADMIN_EMAIL` (optional bootstrap rule for first admin)

## Operational notes

### Deploying

- Deploys cleanly on Vercel as a standard Next.js App Router app.
- Ensure Supabase Auth redirect URLs include your production + preview URLs as needed.
- Configure Vercel Cron to call `POST /api/cron/expiry-alerts` with `CRON_SECRET`.

### Email deliverability

- Use a verified sender domain for `RESEND_FROM_EMAIL`.
- Expect cron traffic volume roughly equal to “vehicles with expiries at 14d/1d” each day.

## Security & audit considerations (current posture)

What’s good:

- **RLS-first** multi-tenancy model on core tables.
- `invites` table is service-role only (no authenticated policies).
- Cron and server-to-server invite creation are protected by bearer secrets.

Watch-outs / improvements to consider:

- **Invite consumption atomicity**: current “check then update used” pattern is best-effort; consider making it transactionally atomic if replay/race matters.
- **Expiry type normalization**: if business rules depend on a canonical type (e.g. “RCA”, “itp”), enforce a normalized representation (DB constraint or app normalization) to avoid duplicates.
- **Admin UI localization**: `/admin/invites` currently uses hard-coded strings; align it with `next-intl` patterns for consistent UX.

## Code map (“where things live”)

- **Layouts & routing**
  - `app/[locale]/(auth)/...` (public)
  - `app/[locale]/(app)/...` (authenticated)
- **Server API**
  - `app/api/auth/signup/route.ts`
  - `app/api/invite/route.ts`
  - `app/api/cron/expiry-alerts/route.ts`
- **Supabase clients**
  - `lib/supabase/server` (SSR user-session client)
  - `lib/supabase/admin` (service-role client)
- **Auth helpers**
  - `lib/auth.ts`
- **Queries**
  - `lib/queries.ts`
- **Actions**
  - `lib/actions/*`
- **Email**
  - `lib/email/*`
- **Schema**
  - `supabase/migrations/*`

