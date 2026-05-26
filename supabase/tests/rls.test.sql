begin;

select plan(3);

select has_table('public', 'archive_files', 'archive_files table exists');
select policies_are(
  'public',
  'archive_files',
  array['archive_files_select_visible', 'archive_files_admin_all'],
  'archive_files has expected policies'
);
select has_function('public', 'can_download_file', array['uuid'], 'download guard function exists');

select * from finish();

rollback;
