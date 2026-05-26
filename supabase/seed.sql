insert into public.access_groups (id, name, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Members', 'Default access group for approved archive members.'),
  ('22222222-2222-2222-2222-222222222222', 'Research Team', 'Example restricted collection for internal researchers.')
on conflict (id) do nothing;

insert into public.collections (id, name, description)
values
  ('33333333-3333-3333-3333-333333333333', 'Public Records', 'General archive records available to approved members.'),
  ('44444444-4444-4444-4444-444444444444', 'Research Notes', 'Example restricted collection for team-only material.')
on conflict (id) do nothing;

insert into public.archive_files (
  id,
  title,
  description,
  filename,
  extension,
  mime_type,
  storage_path,
  status,
  collection_id,
  published_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Example Archive Brief',
    'A placeholder record for testing protected downloads.',
    'example-archive-brief.pdf',
    'pdf',
    'application/pdf',
    'demo/example-archive-brief.pdf',
    'published',
    '33333333-3333-3333-3333-333333333333',
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Restricted Research Note',
    'A placeholder record only visible to the research access group.',
    'restricted-research-note.docx',
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'demo/restricted-research-note.pdf',
    'published',
    '44444444-4444-4444-4444-444444444444',
    now()
  )
on conflict (id) do nothing;

insert into public.archive_file_access_groups (file_id, access_group_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.file_text_chunks (file_id, chunk_index, text)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'This example brief is searchable demo content for the private archive starter.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 'This restricted note demonstrates text search scoped by access group membership.')
on conflict do nothing;
