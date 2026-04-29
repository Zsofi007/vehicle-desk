-- User profiles (role-based access)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user',
  email_notifications boolean not null default true,
  preferred_language text not null default 'ro',
  created_at timestamptz not null default now()
);

-- If the table existed already (older migration run), backfill missing columns.
alter table public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists preferred_language text not null default 'ro';

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_preferred_language_idx on public.profiles (preferred_language);

alter table public.profiles enable row level security;

-- Table privileges + RLS: users can only read their own row.
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant insert, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

do $$
begin
  create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
exception
  when duplicate_object then null;
end $$;

