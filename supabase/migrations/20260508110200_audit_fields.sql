-- Phase 3: Audit fields (created/updated metadata)

-- Vehicles already has created_at; add the rest.
alter table public.vehicles
  add column if not exists updated_at timestamptz,
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists updated_by uuid references auth.users (id);

-- Maintenance records: add audit fields.
alter table public.maintenance_records
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists updated_by uuid references auth.users (id);

-- Expiry items: add audit fields.
alter table public.expiry_items
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists updated_by uuid references auth.users (id);

-- Backfill timestamps for existing rows
update public.vehicles
set updated_at = created_at
where updated_at is null;

update public.maintenance_records
set created_at = now()
where created_at is null;

update public.maintenance_records
set updated_at = created_at
where updated_at is null;

update public.expiry_items
set created_at = now()
where created_at is null;

update public.expiry_items
set updated_at = created_at
where updated_at is null;

-- Set defaults + not-null constraints after backfill
alter table public.vehicles
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

alter table public.maintenance_records
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

alter table public.expiry_items
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

-- Trigger function: keep updated_at/updated_by consistent.
create or replace function app_private.audit_fields_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_at is null then
      new.created_at := now();
    end if;
    if new.updated_at is null then
      new.updated_at := now();
    end if;
    if new.created_by is null then
      new.created_by := auth.uid();
    end if;
    if new.updated_by is null then
      new.updated_by := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), old.updated_by);
  end if;

  return new;
end;
$$;

revoke all on function app_private.audit_fields_set() from public;
grant execute on function app_private.audit_fields_set() to authenticated;

drop trigger if exists vehicles_audit_fields_set on public.vehicles;
create trigger vehicles_audit_fields_set
before insert or update on public.vehicles
for each row execute function app_private.audit_fields_set();

drop trigger if exists maintenance_records_audit_fields_set on public.maintenance_records;
create trigger maintenance_records_audit_fields_set
before insert or update on public.maintenance_records
for each row execute function app_private.audit_fields_set();

drop trigger if exists expiry_items_audit_fields_set on public.expiry_items;
create trigger expiry_items_audit_fields_set
before insert or update on public.expiry_items
for each row execute function app_private.audit_fields_set();

