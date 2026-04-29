-- Invite-only registration

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists invites_token_idx on public.invites (token);
create index if not exists invites_email_idx on public.invites (email);

alter table public.invites enable row level security;

-- No policies: deny all for anon/authenticated. Service role bypasses RLS.
revoke all on table public.invites from anon;
revoke all on table public.invites from authenticated;
grant all on table public.invites to service_role;

