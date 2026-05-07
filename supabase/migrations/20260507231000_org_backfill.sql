-- Phase 1 backfill: create per-user organizations and migrate existing vehicles.
-- Strategy: for each existing profile/user, create an organization whose id equals the user id.
-- This creates a deterministic mapping with minimal migration complexity.

-- 1) Create one org per user (id = user_id).
insert into public.organizations (id, name)
select
  p.id as id,
  coalesce(
    nullif(btrim(p.company_name), ''),
    nullif(split_part(btrim(p.email), '@', 1), ''),
    nullif(btrim(p.email), ''),
    'Organization'
  ) as name
from public.profiles p
where p.id is not null
on conflict (id) do nothing;

-- 2) Make each user the owner of their default org.
insert into public.organization_members (organization_id, user_id, role)
select
  p.id as organization_id,
  p.id as user_id,
  'owner' as role
from public.profiles p
where p.id is not null
on conflict (organization_id, user_id) do nothing;

-- 3) Backfill vehicles.organization_id from legacy vehicles.user_id.
update public.vehicles v
set organization_id = v.user_id
where v.organization_id is null
  and v.user_id is not null;

-- 4) Set each user's active org if missing.
update public.profiles p
set active_organization_id = p.id
where (p.active_organization_id is null)
  and p.id is not null;

-- 5) Enforce organization_id going forward.
alter table public.vehicles
  alter column organization_id set not null;

