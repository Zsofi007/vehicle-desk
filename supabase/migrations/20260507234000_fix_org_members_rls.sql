-- Fix: infinite recursion in organization_members RLS (42P17)
-- We avoid querying organization_members within its own policy by using a SECURITY DEFINER helper.

create schema if not exists app_private;

revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create or replace function app_private.is_org_owner(p_org_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = p_user_id
      and m.role = 'owner'
  );
$$;

revoke all on function app_private.is_org_owner(uuid, uuid) from public;
grant execute on function app_private.is_org_owner(uuid, uuid) to authenticated;

-- Replace recursive policy with a function-based one.
drop policy if exists "org_members_select_owner" on public.organization_members;

do $$
begin
  create policy "org_members_select_owner_v2" on public.organization_members
  for select
  using (
    user_id = auth.uid()
    or app_private.is_org_owner(organization_members.organization_id, auth.uid())
  );
exception
  when duplicate_object then null;
end $$;

