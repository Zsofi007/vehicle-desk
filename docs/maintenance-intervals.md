# Phase 8 — Recurring maintenance intervals

This phase adds a simple, deterministic “recurring maintenance” system based on **km + time** intervals.

## What it does
- Lets an org configure **default intervals per maintenance type** (in Settings).
- Lets a user optionally configure **per-vehicle overrides** (on the vehicle page).
- Computes status per vehicle + type:
  - `ok`
  - `due_soon` (within thresholds)
  - `overdue` (past next due)
  - `no_history` (no prior record for that type)

“Due soon” is **whichever comes first** (km or time).

## Where data lives

### Defaults (org-scoped)
`public.maintenance_interval_defaults`
- Primary key: `(organization_id, type)`
- `interval_km`, `interval_days` can be null (rule disabled)
- `due_soon_km`, `due_soon_days` thresholds

### Overrides (vehicle-scoped)
`public.maintenance_interval_overrides`
- Primary key: `(vehicle_id, type)`
- Overrides interval fields for that vehicle

Both tables are protected by org membership RLS.

## How “due” is computed
The DB function `public.maintenance_due_for_org(organization_id)`:
1. Verifies the caller is a member of the org.
2. For each vehicle in the org, for each canonical maintenance type:
   - Resolves **effective interval** (override → default).
   - Looks up the most recent maintenance record (`maintenance_records`) by `odometer desc, date desc`.
   - Computes `next_due_odometer` and/or `next_due_date`.
3. Returns status + reason (`km` or `time`) for rows that are configured.

Default “due soon” thresholds (if not configured in the DB):
- **1000 km** or **14 days**

## Manual QA checklist
- In Settings, set defaults for `OIL_CHANGE` (e.g. 10000 km and 365 days).
- On a vehicle page, confirm the recurring maintenance panel appears and shows status chips.
- Add a maintenance record for `OIL_CHANGE` and verify status moves to `ok`.
- Increase vehicle odometer near the threshold and verify `due_soon`.
- Exceed threshold and verify `overdue`.
- Set a per-vehicle override and confirm it takes precedence over org defaults.
- Cross-org: user in org A cannot read or edit org B defaults/overrides (RLS).

