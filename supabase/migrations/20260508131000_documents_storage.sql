-- Phase 7: Document uploads foundation (Supabase Storage + metadata)

create schema if not exists app_private;

-- 1) Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('org-documents', 'org-documents', false)
on conflict (id) do nothing;

-- 2) Metadata table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null,
  expiry_item_id uuid references public.expiry_items (id) on delete cascade,
  maintenance_record_id uuid references public.maintenance_records (id) on delete cascade,
  bucket_id text not null default 'org-documents',
  object_path text not null,
  filename text not null,
  content_type text not null,
  size_bytes int not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint documents_kind_check check (kind in ('expiry','maintenance')),
  constraint documents_exactly_one_parent_check check (
    (expiry_item_id is not null and maintenance_record_id is null)
    or (expiry_item_id is null and maintenance_record_id is not null)
  )
);

create index if not exists documents_org_idx on public.documents (organization_id);
create index if not exists documents_expiry_idx on public.documents (expiry_item_id);
create index if not exists documents_maintenance_idx on public.documents (maintenance_record_id);

alter table public.documents enable row level security;

-- Data API / table privileges
revoke all on table public.documents from anon;
revoke all on table public.documents from authenticated;
grant select, insert, delete on table public.documents to authenticated;
grant all on table public.documents to service_role;

-- RLS: org-scoped access
do $$
begin
  create policy "documents_select_org" on public.documents
  for select
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = documents.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "documents_insert_org" on public.documents
  for insert
  with check (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = documents.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "documents_delete_org" on public.documents
  for delete
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = documents.organization_id
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- 3) Deletion queue for parent deletes (to avoid orphaned blobs)
create table if not exists public.document_deletions_queue (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  bucket_id text not null,
  object_path text not null,
  kind text not null,
  parent_id uuid not null,
  created_at timestamptz not null default now(),
  constraint document_deletions_kind_check check (kind in ('expiry','maintenance'))
);

create index if not exists document_deletions_queue_parent_idx
  on public.document_deletions_queue (kind, parent_id, created_at desc);

alter table public.document_deletions_queue enable row level security;

revoke all on table public.document_deletions_queue from anon;
revoke all on table public.document_deletions_queue from authenticated;
grant all on table public.document_deletions_queue to service_role;

-- Enqueue function (called from BEFORE DELETE triggers)
create or replace function app_private.enqueue_document_deletions_for_parent(
  p_kind text,
  p_parent_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.document_deletions_queue (organization_id, bucket_id, object_path, kind, parent_id)
  select d.organization_id, d.bucket_id, d.object_path, p_kind, p_parent_id
  from public.documents d
  where (
    (p_kind = 'expiry' and d.expiry_item_id = p_parent_id)
    or (p_kind = 'maintenance' and d.maintenance_record_id = p_parent_id)
  );
$$;

revoke all on function app_private.enqueue_document_deletions_for_parent(text, uuid) from public;
grant execute on function app_private.enqueue_document_deletions_for_parent(text, uuid) to authenticated;
grant execute on function app_private.enqueue_document_deletions_for_parent(text, uuid) to service_role;

-- Triggers: enqueue before parent delete (so docs rows still exist)
create or replace function public.expiry_items_enqueue_doc_deletions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform app_private.enqueue_document_deletions_for_parent('expiry', old.id);
  return old;
end;
$$;

create or replace function public.maintenance_records_enqueue_doc_deletions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform app_private.enqueue_document_deletions_for_parent('maintenance', old.id);
  return old;
end;
$$;

drop trigger if exists expiry_items_enqueue_doc_deletions on public.expiry_items;
create trigger expiry_items_enqueue_doc_deletions
before delete on public.expiry_items
for each row execute function public.expiry_items_enqueue_doc_deletions();

drop trigger if exists maintenance_records_enqueue_doc_deletions on public.maintenance_records;
create trigger maintenance_records_enqueue_doc_deletions
before delete on public.maintenance_records
for each row execute function public.maintenance_records_enqueue_doc_deletions();

-- 4) Storage RLS policies (private bucket, org folder scoping + allowed extensions)
-- Allow members to read/list objects in their org folder
do $$
begin
  create policy "org_documents_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'org-documents'
    and (storage.foldername(name))[1] = 'org'
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id::text = (storage.foldername(name))[2]
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- Allow uploads for members under org/<orgId>/... with allowed extensions
do $$
begin
  create policy "org_documents_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'org-documents'
    and (storage.foldername(name))[1] = 'org'
    and storage.extension(name) in ('pdf','jpg','jpeg','png','webp')
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id::text = (storage.foldername(name))[2]
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

-- Allow delete for members under their org folder
do $$
begin
  create policy "org_documents_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'org-documents'
    and (storage.foldername(name))[1] = 'org'
    and exists (
      select 1
      from public.organization_members m
      where m.organization_id::text = (storage.foldername(name))[2]
        and m.user_id = auth.uid()
    )
  );
exception
  when duplicate_object then null;
end $$;

