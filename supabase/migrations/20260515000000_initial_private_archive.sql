create extension if not exists "pgcrypto";

create type public.profile_role as enum ('member', 'admin');
create type public.archive_file_status as enum ('draft', 'published', 'archived');

create schema if not exists app_private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.profile_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.access_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.member_access_groups (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  access_group_id uuid not null references public.access_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, access_group_id)
);

create table public.archive_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null unique,
  status public.archive_file_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.archive_file_access_groups (
  file_id uuid not null references public.archive_files(id) on delete cascade,
  access_group_id uuid not null references public.access_groups(id) on delete cascade,
  primary key (file_id, access_group_id)
);

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, 'unknown@example.com'))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.access_groups enable row level security;
alter table public.member_access_groups enable row level security;
alter table public.archive_files enable row level security;
alter table public.archive_file_access_groups enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.can_download_file(target_file_id uuid)
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1
    from public.archive_files f
    join public.archive_file_access_groups fag on fag.file_id = f.id
    join public.member_access_groups mag on mag.access_group_id = fag.access_group_id
    where f.id = target_file_id
      and f.status = 'published'
      and mag.profile_id = auth.uid()
  ) or public.is_admin();
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "access_groups_select_member_or_admin"
  on public.access_groups for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.member_access_groups mag
      where mag.access_group_id = access_groups.id
        and mag.profile_id = auth.uid()
    )
  );

create policy "access_groups_admin_all"
  on public.access_groups for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "member_access_groups_select_own_or_admin"
  on public.member_access_groups for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "member_access_groups_admin_all"
  on public.member_access_groups for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "archive_files_select_visible"
  on public.archive_files for select
  using (
    public.is_admin()
    or (
      status = 'published'
      and exists (
        select 1
        from public.archive_file_access_groups fag
        join public.member_access_groups mag on mag.access_group_id = fag.access_group_id
        where fag.file_id = archive_files.id
          and mag.profile_id = auth.uid()
      )
    )
  );

create policy "archive_files_admin_all"
  on public.archive_files for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "archive_file_access_groups_select_visible"
  on public.archive_file_access_groups for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.member_access_groups mag
      where mag.access_group_id = archive_file_access_groups.access_group_id
        and mag.profile_id = auth.uid()
    )
  );

create policy "archive_file_access_groups_admin_all"
  on public.archive_file_access_groups for all
  using (public.is_admin())
  with check (public.is_admin());

create view public.visible_archive_files
with (security_invoker = true)
as
select
  id,
  title,
  description,
  published_at
from public.archive_files
where status = 'published';

create index archive_files_status_published_at_idx
  on public.archive_files (status, published_at desc);

create index member_access_groups_access_group_idx
  on public.member_access_groups (access_group_id);

create index archive_file_access_groups_access_group_idx
  on public.archive_file_access_groups (access_group_id);
