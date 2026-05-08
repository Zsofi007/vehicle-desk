-- Phase 8 extension: Odometer freshness tracking + reminder support

create schema if not exists app_private;

-- 1) Columns
alter table public.vehicles
  add column if not exists last_odometer_update_at timestamptz,
  add column if not exists last_odometer_reminder_sent_at timestamptz;

-- Backfill existing rows safely
update public.vehicles
set last_odometer_update_at = coalesce(last_odometer_update_at, now())
where last_odometer_update_at is null;

-- Defaults / not null
alter table public.vehicles
  alter column last_odometer_update_at set default now(),
  alter column last_odometer_update_at set not null;

-- 2) Automatic tracking on vehicles
create or replace function app_private.vehicle_odometer_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.last_odometer_update_at is null then
      new.last_odometer_update_at := now();
    end if;
    return new;
  end if;

  -- UPDATE: only touch if odometer value actually changes
  if new.odometer is distinct from old.odometer then
    new.last_odometer_update_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists vehicles_odometer_touch on public.vehicles;
create trigger vehicles_odometer_touch
before insert or update on public.vehicles
for each row execute function app_private.vehicle_odometer_touch();

-- 3) Maintenance record insert/update should also count as an odometer update
-- (and keep vehicles.odometer monotonic with new readings).
create or replace function app_private.maintenance_record_odometer_touch_vehicle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current int;
begin
  if tg_op = 'UPDATE' and new.odometer is not distinct from old.odometer then
    return new;
  end if;

  select odometer into v_current
  from public.vehicles
  where id = new.vehicle_id;

  update public.vehicles
  set
    odometer = greatest(coalesce(v_current, 0), new.odometer),
    last_odometer_update_at = now()
  where id = new.vehicle_id;

  return new;
end;
$$;

drop trigger if exists maintenance_records_odometer_touch_vehicle on public.maintenance_records;
create trigger maintenance_records_odometer_touch_vehicle
after insert or update on public.maintenance_records
for each row execute function app_private.maintenance_record_odometer_touch_vehicle();

