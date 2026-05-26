create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.archive_files
  add column filename text,
  add column extension text,
  add column mime_type text,
  add column size_bytes bigint,
  add column sha256 text,
  add column collection_id uuid references public.collections(id) on delete set null,
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(filename, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

update public.archive_files
set
  filename = coalesce(filename, nullif(regexp_replace(storage_path, '^.*/', ''), ''), title),
  extension = lower(nullif(substring(storage_path from '\.([A-Za-z0-9]{1,12})$'), '')),
  mime_type = case lower(substring(storage_path from '\.([A-Za-z0-9]{1,12})$'))
    when 'pdf' then 'application/pdf'
    when 'doc' then 'application/msword'
    when 'docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    when 'xls' then 'application/vnd.ms-excel'
    when 'xlsx' then 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    when 'ppt' then 'application/vnd.ms-powerpoint'
    when 'pptx' then 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    when 'txt' then 'text/plain'
    when 'csv' then 'text/csv'
    else 'application/octet-stream'
  end
where filename is null;

alter table public.archive_files
  alter column filename set not null;

alter table public.archive_files
  add constraint archive_files_sha256_hex
  check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$');

create table public.file_text_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.archive_files(id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  search_vector tsvector generated always as (to_tsvector('english', coalesce(text, ''))) stored,
  created_at timestamptz not null default now(),
  unique (file_id, chunk_index)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;
alter table public.file_text_chunks enable row level security;
alter table public.audit_events enable row level security;

drop view public.visible_archive_files;

create view public.visible_archive_files
with (security_invoker = true)
as
select
  f.id,
  f.title,
  f.description,
  f.filename,
  f.extension,
  f.mime_type,
  f.size_bytes,
  f.collection_id,
  c.name as collection_name,
  f.search_vector,
  f.published_at
from public.archive_files f
left join public.collections c on c.id = f.collection_id
where f.status = 'published';

create policy "collections_select_visible_or_admin"
  on public.collections for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.archive_files f
      where f.collection_id = collections.id
        and f.status = 'published'
        and public.can_download_file(f.id)
    )
  );

create policy "collections_admin_all"
  on public.collections for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "file_text_chunks_select_visible"
  on public.file_text_chunks for select
  using (public.can_download_file(file_id));

create policy "file_text_chunks_admin_all"
  on public.file_text_chunks for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "audit_events_admin_select"
  on public.audit_events for select
  using (public.is_admin());

create policy "audit_events_authenticated_insert"
  on public.audit_events for insert
  with check (actor_id = auth.uid() or public.is_admin());

create index archive_files_search_vector_idx
  on public.archive_files using gin (search_vector);

create index archive_files_collection_idx
  on public.archive_files (collection_id);

create index file_text_chunks_file_idx
  on public.file_text_chunks (file_id);

create index file_text_chunks_search_vector_idx
  on public.file_text_chunks using gin (search_vector);
