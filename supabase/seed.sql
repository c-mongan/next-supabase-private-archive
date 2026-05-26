insert into public.access_groups (id, name, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Members', 'Default access group for approved archive members.'),
  ('22222222-2222-2222-2222-222222222222', 'Research Team', 'Example restricted collection for internal researchers.')
on conflict (id) do nothing;

insert into public.archive_files (
  id,
  title,
  description,
  storage_path,
  status,
  published_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Example Archive Brief',
    'A placeholder record for testing protected downloads.',
    'demo/example-archive-brief.pdf',
    'published',
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Restricted Research Note',
    'A placeholder record only visible to the research access group.',
    'demo/restricted-research-note.pdf',
    'published',
    now()
  )
on conflict (id) do nothing;

insert into public.archive_file_access_groups (file_id, access_group_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;
