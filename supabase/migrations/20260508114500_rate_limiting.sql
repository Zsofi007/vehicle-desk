-- Phase 5: Postgres-backed rate limiting (no Redis)

create schema if not exists app_private;

-- Shared counter table (write only via SECURITY DEFINER RPC)
create table if not exists public.rate_limits (
  id bigserial primary key,
  scope text not null,
  key text not null,
  bucket_start timestamptz not null,
  count int not null default 0,
  created_at timestamptz not null default now(),
  constraint rate_limits_scope_key_bucket_unique unique (scope, key, bucket_start)
);

create index if not exists rate_limits_scope_key_bucket_idx
  on public.rate_limits (scope, key, bucket_start desc);

-- Lock down table access: only service_role can access directly.
revoke all on table public.rate_limits from anon;
revoke all on table public.rate_limits from authenticated;
grant all on table public.rate_limits to service_role;

-- Atomic hit function: increments bucketed counter and returns allowance info.
create or replace function app_private.rate_limit_hit(
  p_scope text,
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns table (
  allowed boolean,
  remaining int,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_bucket_start timestamptz;
  v_reset_at timestamptz;
  v_count int;
begin
  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;
  if p_limit is null or p_limit <= 0 then
    raise exception 'p_limit must be > 0';
  end if;
  if p_scope is null or length(trim(p_scope)) = 0 then
    raise exception 'p_scope required';
  end if;
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'p_key required';
  end if;

  v_bucket_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds) at time zone 'UTC';
  v_reset_at := v_bucket_start + make_interval(secs => p_window_seconds);

  insert into public.rate_limits (scope, key, bucket_start, count)
  values (p_scope, p_key, v_bucket_start, 1)
  on conflict (scope, key, bucket_start)
  do update set count = public.rate_limits.count + 1
  returning public.rate_limits.count into v_count;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  reset_at := v_reset_at;
  return next;
end;
$$;

revoke all on function app_private.rate_limit_hit(text, text, int, int) from public;
grant execute on function app_private.rate_limit_hit(text, text, int, int) to anon;
grant execute on function app_private.rate_limit_hit(text, text, int, int) to authenticated;

-- Retention helper (manual/scheduled use later)
create or replace function app_private.rate_limit_prune(p_older_than interval)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from public.rate_limits
  where bucket_start < now() - p_older_than;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function app_private.rate_limit_prune(interval) from public;
grant execute on function app_private.rate_limit_prune(interval) to service_role;

