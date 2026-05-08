-- Phase 2: Normalize expiry/maintenance type fields to canonical keys.
-- Uses CHECK constraints (migration-friendly) instead of Postgres enums.

-- 1) Add constraints (NOT VALID first, so existing rows don't fail immediately)
alter table public.expiry_items
add constraint expiry_items_type_canonical_check
check (
  type in ('RCA', 'CASCO', 'ITP', 'VIGNETTE', 'ROVINIETA', 'OTHER')
) not valid;

alter table public.maintenance_records
add constraint maintenance_records_type_canonical_check
check (
  type in ('OIL_CHANGE', 'BRAKES', 'TIRES', 'BATTERY', 'FILTERS', 'TIMING_BELT', 'OTHER')
) not valid;

-- 2) Backfill existing expiry_items.type into canonical keys
update public.expiry_items
set type = case
  when lower(trim(type)) = 'itp' then 'ITP'
  when lower(trim(type)) = 'rca' then 'RCA'
  when lower(trim(type)) = 'casco' then 'CASCO'
  when lower(trim(type)) in ('vignette', 'vignetă', 'vigneta') then 'VIGNETTE'
  when lower(trim(type)) in ('rovinietă', 'rovinieta') then 'ROVINIETA'
  else 'OTHER'
end
where type is not null;

-- 3) Backfill existing maintenance_records.type into canonical keys
update public.maintenance_records
set type = case
  when lower(trim(type)) in ('oil', 'oil & filters', 'oil and filters') then 'OIL_CHANGE'
  when lower(trim(type)) in ('filters', 'filter') then 'FILTERS'
  when lower(trim(type)) = 'brakes' then 'BRAKES'
  when lower(trim(type)) in ('tyres', 'tires', 'tire') then 'TIRES'
  when lower(trim(type)) = 'battery' then 'BATTERY'
  when lower(trim(type)) in ('timing belt', 'timing_belt') then 'TIMING_BELT'
  else 'OTHER'
end
where type is not null;

-- 4) Validate constraints after backfill
alter table public.expiry_items
validate constraint expiry_items_type_canonical_check;

alter table public.maintenance_records
validate constraint maintenance_records_type_canonical_check;

