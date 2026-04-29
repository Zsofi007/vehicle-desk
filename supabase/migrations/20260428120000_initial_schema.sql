-- Vehicle maintenance tracker — schema + RLS
-- Apply via Supabase SQL editor or: supabase db push

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  license_plate text not null,
  odometer int not null default 0,
  created_at timestamptz not null default now()
);

create index vehicles_user_id_idx on public.vehicles (user_id);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type text not null,
  date date not null,
  odometer int not null,
  notes text
);

create index maintenance_records_vehicle_id_idx on public.maintenance_records (vehicle_id);

create table public.expiry_items (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type text not null,
  expiry_date date not null,
  cost numeric(12, 2)
);

create index expiry_items_vehicle_id_idx on public.expiry_items (vehicle_id);
create index expiry_items_expiry_date_idx on public.expiry_items (expiry_date);

alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.expiry_items enable row level security;

create policy "vehicles_select_own" on public.vehicles for select using (auth.uid() = user_id);

create policy "vehicles_insert_own" on public.vehicles for insert
with check (auth.uid() = user_id);

create policy "vehicles_update_own" on public.vehicles for update using (auth.uid() = user_id);

create policy "vehicles_delete_own" on public.vehicles for delete using (auth.uid() = user_id);

create policy "maintenance_select_own" on public.maintenance_records for select using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenance_records.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "maintenance_insert_own" on public.maintenance_records for insert
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenance_records.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "maintenance_update_own" on public.maintenance_records for update using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenance_records.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "maintenance_delete_own" on public.maintenance_records for delete using (
  exists (
    select 1
    from public.vehicles v
    where v.id = maintenance_records.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "expiry_select_own" on public.expiry_items for select using (
  exists (
    select 1
    from public.vehicles v
    where v.id = expiry_items.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "expiry_insert_own" on public.expiry_items for insert
with check (
  exists (
    select 1
    from public.vehicles v
    where v.id = expiry_items.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "expiry_update_own" on public.expiry_items for update using (
  exists (
    select 1
    from public.vehicles v
    where v.id = expiry_items.vehicle_id and v.user_id = auth.uid()
  )
);

create policy "expiry_delete_own" on public.expiry_items for delete using (
  exists (
    select 1
    from public.vehicles v
    where v.id = expiry_items.vehicle_id and v.user_id = auth.uid()
  )
);
