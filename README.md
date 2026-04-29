# Vehicle Desk

Production-oriented starter for tracking vehicles, maintenance history, and renewal/expiry dates (insurance, inspection, vignette, etc.). Built with Next.js (App Router), Supabase Auth + Postgres (RLS), Tailwind CSS, and **next-intl** for English, Hungarian, and Romanian.

## Features

- Email/password authentication (protected app routes)
- Invite-only registration (no public signup)
- Vehicles CRUD (list, detail, add, delete)
- Maintenance records per vehicle
- Expiry items with status: **Expired** and **Due within 7 days** (calendar UTC dates)
- Dashboard: vehicle count, expired alerts, renewals due in the next 7 days
- Locales: `/en`, `/hu`, `/ro` with URL prefix and locale persistence via next-intl

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key (server-only; required for invite-only signup) |
| `ADMIN_EMAIL` | Optional: bootstrap a specific email as `admin` on signup |
| `INVITE_ADMIN_TOKEN` | Optional: server-to-server secret for `POST /api/invite` (automation) |
| `RESEND_API_KEY` | Resend API key (server-only) |
| `RESEND_FROM_EMAIL` | From address (e.g. `Vehicle Desk <no-reply@yourdomain.com>`) |
| `CRON_SECRET` | Secret for Vercel cron to call `/api/cron/expiry-alerts` |

Only the **publishable** key is used in the browser and server with the user session. Do **not** expose the service role key to the client.

## Database setup (Supabase)

1. In the Supabase SQL editor (or CLI), run the migrations:
   - [`supabase/migrations/20260428120000_initial_schema.sql`](supabase/migrations/20260428120000_initial_schema.sql)
   - [`supabase/migrations/20260429215000_invites.sql`](supabase/migrations/20260429215000_invites.sql)
   - [`supabase/migrations/20260429220500_profiles.sql`](supabase/migrations/20260429220500_profiles.sql)
2. Confirm tables `vehicles`, `maintenance_records`, and `expiry_items` exist and **Row Level Security** is enabled.
3. Authentication → Providers → enable **Email**. For local testing, you may disable “Confirm email” or use Supabase Auth hooks / inbox per your workflow.
4. Authentication → Settings: **disable public signups** (e.g. “Disable new user signups”). Invite-only enforcement in this app assumes Supabase public signup is disabled.

## Admin (invites)

The admin UI lives at `/en/admin/invites` (or `/hu/...`, `/ro/...`) and is protected server-side by the `profiles.role` value.

### Create an admin user (SQL)

Insert (or update) a profile row for a user:

```sql
insert into public.profiles (id, email, role)
values ('USER_ID_HERE', 'your@email.com', 'admin')
on conflict (id) do update set role = excluded.role;
```

### Optional bootstrap env

If you set `ADMIN_EMAIL` (server-side), that email will be created with role `admin` on invite-based signup. If no admin exists yet, the first registered user becomes admin.

### RLS model

- `vehicles.user_id` must equal `auth.uid()` for all access.
- Child rows (`maintenance_records`, `expiry_items`) are allowed only when their `vehicle_id` belongs to a vehicle owned by `auth.uid()`.
- All policies are `SELECT` / `INSERT` / `UPDATE` / `DELETE` scoped accordingly—no cross-tenant reads or writes.

### Redirect URLs (production)

In Supabase Auth settings, add your Vercel URL (and `http://localhost:3000` for dev) to **Redirect URLs** so magic links and OAuth (if added later) work.

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you will be redirected to a locale route (e.g. `/en/login`).

## Internationalization and UTF-8

- UI strings live in [`i18n/en.json`](i18n/en.json), [`i18n/hu.json`](i18n/hu.json), and [`i18n/ro.json`](i18n/ro.json).
- The app uses **Inter** with `latin` + `latin-ext` subsets for proper rendering of Hungarian and Romanian characters. User content is stored as UTF-8 in Postgres (Supabase default); do not strip diacritics in application code.

## Date logic

Expiry and maintenance **dates** are compared as **UTC calendar dates** (`YYYY-MM-DD`) for “today”, “expired”, and “due within 7 days”. Document any change if you switch to local-time semantics.

## Deploying on Vercel

1. Import the Git repository into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project **Environment Variables** (Production & Preview as needed).
3. Default build: `npm run build`, output: Next.js.

No extra Vercel-only flags are required for this starter.

## Email alerts (cron)

This app sends renewal/expiry reminder emails:
- **14 days before** expiry
- **1 day before** expiry

Vercel Cron hits `POST /api/cron/expiry-alerts` daily. The endpoint requires:
- `Authorization: Bearer $CRON_SECRET`

On successful send, `expiry_items.notified_14d` / `expiry_items.notified_1d` are set to `true` so users don’t get duplicate reminders.

## Design reference (Google Stitch MCP)

If you use the Stitch MCP server to inspect an existing design:

1. Use **`list_projects`** / **`list_screens`** / **`get_screen`** only to understand **information hierarchy** and **rough structure** (sections, primary actions).
2. Rebuild the UI in this codebase with **simpler** layout and **neutral** styling—do not paste Stitch HTML or match decorative styling pixel-for-pixel.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## License

Private / your choice—configure per your organization.
