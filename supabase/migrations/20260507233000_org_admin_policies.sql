-- Phase 1 follow-up: org admin capabilities
-- - Allow org owner/admin to update organization name
-- - Allow org owners to see full membership list

-- organizations: allow update for org admins
grant update on table public.organizations to authenticated;

do $$
begin
  create policy "organizations_update_admin" on public.organizations
  for update
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );
exception
  when duplicate_object then null;
end $$;

-- organization_members: allow org owners to list all members in their org
drop policy if exists "org_members_select_own" on public.organization_members;

do $$
begin
  create policy "org_members_select_owner" on public.organization_members
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.organization_members m2
      where m2.organization_id = organization_members.organization_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
    )
  );
exception
  when duplicate_object then null;
end $$;

