-- Organizations / team model (Phase 1)
-- Adds org tables, org-scoped tenancy for vehicles, and org-aware invites.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint organization_members_role_check check (role in ('owner','admin','member')),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);
create index if not exists organization_members_org_id_idx on public.organization_members (organization_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Data API / table privileges
revoke all on table public.organizations from anon;
revoke all on table public.organizations from authenticated;
grant select on table public.organizations to authenticated;
grant all on table public.organizations to service_role;

revoke all on table public.organization_members from anon;
revoke all on table public.organization_members from authenticated;
grant select on table public.organization_members to authenticated;
grant all on table public.organization_members to service_role;

-- Policies
do $$
begin
  create policy "organizations_select_member" on public.organizations
  for select
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "org_members_select_own" on public.organization_members
  for select
  using (user_id = auth.uid());
exception
  when duplicate_object then null;
end $$;

-- Vehicles: add organization_id tenancy column.
alter table public.vehicles
  add column if not exists organization_id uuid references public.organizations (id);

create index if not exists vehicles_organization_id_idx on public.vehicles (organization_id);

-- Update RLS policies to be organization-scoped (drop legacy user_id policies).
drop policy if exists "vehicles_select_own" on public.vehicles;
drop policy if exists "vehicles_insert_own" on public.vehicles;
drop policy if exists "vehicles_update_own" on public.vehicles;
drop policy if exists "vehicles_delete_own" on public.vehicles;

drop policy if exists "maintenance_select_own" on public.maintenance_records;
drop policy if exists "maintenance_insert_own" on public.maintenance_records;
drop policy if exists "maintenance_update_own" on public.maintenance_records;
drop policy if exists "maintenance_delete_own" on public.maintenance_records;

drop policy if exists "expiry_select_own" on public.expiry_items;
drop policy if exists "expiry_insert_own" on public.expiry_items;
drop policy if exists "expiry_update_own" on public.expiry_items;
drop policy if exists "expiry_delete_own" on public.expiry_items;

do $$
begin
  create policy "vehicles_select_org" on public.vehicles
  for select
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = vehicles.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "vehicles_insert_org" on public.vehicles
  for insert
  with check (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = vehicles.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "vehicles_update_org" on public.vehicles
  for update
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = vehicles.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = vehicles.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "vehicles_delete_org" on public.vehicles
  for delete
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id = vehicles.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_select_org" on public.maintenance_records
  for select
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = maintenance_records.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_insert_org" on public.maintenance_records
  for insert
  with check (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = maintenance_records.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_update_org" on public.maintenance_records
  for update
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = maintenance_records.vehicle_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = maintenance_records.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "maintenance_delete_org" on public.maintenance_records
  for delete
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = maintenance_records.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "expiry_select_org" on public.expiry_items
  for select
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = expiry_items.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "expiry_insert_org" on public.expiry_items
  for insert
  with check (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = expiry_items.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "expiry_update_org" on public.expiry_items
  for update
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = expiry_items.vehicle_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = expiry_items.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "expiry_delete_org" on public.expiry_items
  for delete
  using (
    exists (
      select 1
      from public.vehicles v
      join public.organization_members m
        on m.organization_id = v.organization_id
      where v.id = expiry_items.vehicle_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- Profiles: store user-selected active org.
alter table public.profiles
  add column if not exists active_organization_id uuid references public.organizations (id);

create index if not exists profiles_active_org_idx on public.profiles (active_organization_id);

-- Invites: optionally attach to an organization.
alter table public.invites
  add column if not exists organization_id uuid references public.organizations (id);

create index if not exists invites_organization_id_idx on public.invites (organization_id);

