-- Phase 8: Recurring maintenance intervals (defaults + per-vehicle overrides)

create schema if not exists app_private;

-- 1) Org defaults
create table if not exists public.maintenance_interval_defaults (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null,
  interval_km int,
  interval_days int,
  due_soon_km int not null default 1000,
  due_soon_days int not null default 14,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  constraint maintenance_interval_defaults_pk primary key (organization_id, type),
  constraint maintenance_interval_defaults_type_check check (
    type in ('OIL_CHANGE','BRAKES','TIRES','BATTERY','FILTERS','TIMING_BELT','OTHER')
  ),
  constraint maintenance_interval_defaults_interval_km_check check (interval_km is null or interval_km > 0),
  constraint maintenance_interval_defaults_interval_days_check check (interval_days is null or interval_days > 0),
  constraint maintenance_interval_defaults_due_soon_km_check check (due_soon_km > 0),
  constraint maintenance_interval_defaults_due_soon_days_check check (due_soon_days > 0)
);

create index if not exists maintenance_interval_defaults_org_idx
  on public.maintenance_interval_defaults (organization_id);

alter table public.maintenance_interval_defaults enable row level security;

-- 2) Per-vehicle overrides
create table if not exists public.maintenance_interval_overrides (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type text not null,
  interval_km int,
  interval_days int,
  due_soon_km int,
  due_soon_days int,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  constraint maintenance_interval_overrides_pk primary key (vehicle_id, type),
  constraint maintenance_interval_overrides_type_check check (
    type in ('OIL_CHANGE','BRAKES','TIRES','BATTERY','FILTERS','TIMING_BELT','OTHER')
  ),
  constraint maintenance_interval_overrides_interval_km_check check (interval_km is null or interval_km > 0),
  constraint maintenance_interval_overrides_interval_days_check check (interval_days is null or interval_days > 0),
  constraint maintenance_interval_overrides_due_soon_km_check check (due_soon_km is null or due_soon_km > 0),
  constraint maintenance_interval_overrides_due_soon_days_check check (due_soon_days is null or due_soon_days > 0)
);

create index if not exists maintenance_interval_overrides_vehicle_idx
  on public.maintenance_interval_overrides (vehicle_id);

alter table public.maintenance_interval_overrides enable row level security;

-- Privileges
revoke all on table public.maintenance_interval_defaults from anon;
revoke all on table public.maintenance_interval_defaults from authenticated;
grant select, insert, update, delete on table public.maintenance_interval_defaults to authenticated;
grant all on table public.maintenance_interval_defaults to service_role;

revoke all on table public.maintenance_interval_overrides from anon;
revoke all on table public.maintenance_interval_overrides from authenticated;
grant select, insert, update, delete on table public.maintenance_interval_overrides to authenticated;
grant all on table public.maintenance_interval_overrides to service_role;

-- RLS: defaults, org membership
do $$
begin
  create policy "maintenance_interval_defaults_select_org" on public.maintenance_interval_defaults
  for select
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = maintenance_interval_defaults.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_interval_defaults_write_org" on public.maintenance_interval_defaults
  for all
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = maintenance_interval_defaults.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = maintenance_interval_defaults.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- RLS: overrides, via vehicles.organization_id membership
do $$
begin
  create policy "maintenance_interval_overrides_select_org" on public.maintenance_interval_overrides
  for select
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m on m.organization_id = v.organization_id
      where v.id = maintenance_interval_overrides.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_interval_overrides_write_org" on public.maintenance_interval_overrides
  for all
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m on m.organization_id = v.organization_id
      where v.id = maintenance_interval_overrides.vehicle_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m on m.organization_id = v.organization_id
      where v.id = maintenance_interval_overrides.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- 3) Due computation RPC
-- Returns one row per vehicle+type where an effective interval is configured.
create or replace function public.maintenance_due_for_org(p_organization_id uuid)
returns table (
  vehicle_id uuid,
  type text,
  last_date date,
  last_odometer int,
  current_odometer int,
  interval_km int,
  interval_days int,
  due_soon_km int,
  due_soon_days int,
  next_due_odometer int,
  next_due_date date,
  status text,
  reason text
)
language sql
security definer
set search_path = public
as $$
  with allowed as (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
    limit 1
  ),
  vehicles_in_org as (
    select v.id as vehicle_id, v.odometer as current_odometer
    from public.vehicles v
    where v.organization_id = p_organization_id
  ),
  types as (
    select unnest(array['OIL_CHANGE','BRAKES','TIRES','BATTERY','FILTERS','TIMING_BELT','OTHER'])::text as type
  ),
  last_records as (
    select distinct on (mr.vehicle_id, mr.type)
      mr.vehicle_id,
      mr.type,
      mr.date::date as last_date,
      mr.odometer::int as last_odometer
    from public.maintenance_records mr
    join vehicles_in_org v on v.vehicle_id = mr.vehicle_id
    order by mr.vehicle_id, mr.type, mr.odometer desc, mr.date desc
  ),
  effective as (
    select
      v.vehicle_id,
      t.type,
      coalesce(o.interval_km, d.interval_km) as interval_km,
      coalesce(o.interval_days, d.interval_days) as interval_days,
      coalesce(o.due_soon_km, d.due_soon_km, 500) as due_soon_km,
      coalesce(o.due_soon_days, d.due_soon_days, 14) as due_soon_days,
      v.current_odometer,
      lr.last_date,
      lr.last_odometer
    from vehicles_in_org v
    cross join types t
    left join public.maintenance_interval_defaults d
      on d.organization_id = p_organization_id
     and d.type = t.type
    left join public.maintenance_interval_overrides o
      on o.vehicle_id = v.vehicle_id
     and o.type = t.type
    left join last_records lr
      on lr.vehicle_id = v.vehicle_id
     and lr.type = t.type
  ),
  configured as (
    select *
    from effective
    where interval_km is not null or interval_days is not null
  )
  select
    c.vehicle_id,
    c.type,
    c.last_date,
    c.last_odometer,
    c.current_odometer,
    c.interval_km,
    c.interval_days,
    c.due_soon_km,
    c.due_soon_days,
    case
      when c.interval_km is not null and c.last_odometer is not null then c.last_odometer + c.interval_km
      else null
    end as next_due_odometer,
    case
      when c.interval_days is not null and c.last_date is not null then (c.last_date + make_interval(days => c.interval_days))::date
      else null
    end as next_due_date,
    case
      when not exists (select 1 from allowed) then 'forbidden'
      when c.last_date is null and c.last_odometer is null then 'no_history'
      when (c.interval_km is not null and c.last_odometer is not null and c.current_odometer >= c.last_odometer + c.interval_km)
        or (c.interval_days is not null and c.last_date is not null and current_date >= (c.last_date + make_interval(days => c.interval_days))::date)
        then 'overdue'
      when (c.interval_km is not null and c.last_odometer is not null and c.current_odometer >= (c.last_odometer + c.interval_km) - c.due_soon_km)
        or (c.interval_days is not null and c.last_date is not null and current_date >= ((c.last_date + make_interval(days => c.interval_days))::date - c.due_soon_days))
        then 'due_soon'
      else 'ok'
    end as status,
    case
      when c.last_date is null and c.last_odometer is null then 'no_history'
      when (c.interval_km is not null and c.last_odometer is not null and c.current_odometer >= c.last_odometer + c.interval_km) then 'km'
      when (c.interval_days is not null and c.last_date is not null and current_date >= (c.last_date + make_interval(days => c.interval_days))::date) then 'time'
      when (c.interval_km is not null and c.last_odometer is not null and c.current_odometer >= (c.last_odometer + c.interval_km) - c.due_soon_km) then 'km'
      when (c.interval_days is not null and c.last_date is not null and current_date >= ((c.last_date + make_interval(days => c.interval_days))::date - c.due_soon_days)) then 'time'
      else null
    end as reason
  from configured c;
$$;

revoke all on function public.maintenance_due_for_org(uuid) from public;
grant execute on function public.maintenance_due_for_org(uuid) to authenticated;
grant execute on function public.maintenance_due_for_org(uuid) to service_role;

