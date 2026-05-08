# Odometer freshness & reminders

This feature improves maintenance accuracy by tracking **odometer freshness** and sending **non-spammy** reminder emails when a vehicle’s odometer hasn’t been updated in a while.

## What gets tracked
`public.vehicles` now has:
- `last_odometer_update_at` (timestamptz, not null)
- `last_odometer_reminder_sent_at` (timestamptz, nullable)

### When `last_odometer_update_at` updates
It updates to `now()` only when the odometer meaningfully changes:
- Vehicle odometer edited directly
- Maintenance record created/updated with an odometer change (also keeps `vehicles.odometer` monotonic via `greatest(...)`)

## Reminder rules (anti-spam)
Daily cron selects vehicles where:
- `last_odometer_update_at` is older than **90 days**
- and `last_odometer_reminder_sent_at` is **null** OR older than **30 days**
- and the user has `profiles.email_notifications = true`

After a successful email send, we set:
- `vehicles.last_odometer_reminder_sent_at = now()`

## Cron endpoint
- `POST /api/cron/odometer-reminders`
- Requires `Authorization: Bearer $CRON_SECRET`

## Email language
Uses `profiles.preferred_language` (`en`/`hu`/`ro`) and preserves diacritics (UTF-8).

## Quick update link
Reminder email links to:
- `/{lang}/vehicles/{id}/quick-odometer`

This page is a minimal form that updates odometer only.

## Manual QA checklist
- Create a vehicle and confirm `last_odometer_update_at` is set.
- Update vehicle odometer → `last_odometer_update_at` changes.
- Create/update a maintenance record with higher odometer → vehicle odometer updates and timestamp changes.
- Cron selection:
  - stale > 90 days + no reminder → email sends
  - reminder sent < 30 days → no email
  - email_notifications disabled → no email
- Quick odometer page updates odometer successfully.

