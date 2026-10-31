# Next Supabase Private Archive

A production-informed starter for private document archives.

This is an open-source starter extracted from the architecture of a private
document-archive site. It keeps the reusable Next.js/Supabase patterns without
any client data, branding, or project-specific workflows.

It is built for teams that need member-only documents, access-group permissions,
admin-managed files, and protected downloads without adopting a full CMS.

## Why This Exists

Most admin templates are dashboards first and security models second. This
starter is the opposite: it begins with the private archive problem.

- Members only see files assigned to their access groups.
- Files are stored in a private Supabase Storage bucket.
- Downloads go through an application route that checks access first.
- Supabase RLS is the primary enforcement layer for archive data.
- Admin screens are focused on users, files, and access groups.

## Stack

- Next.js 16
- React 19
- Supabase Auth
- Supabase Postgres with RLS
- Supabase Storage
- Tailwind CSS 4
- TypeScript

Requires Node.js `20.9.0` or newer.

## Current Template Scope

This repo is intentionally small. The first version includes:

- Public landing page
- Login and signup screens
- Member archive dashboard
- Archive search across metadata and extracted text chunks
- File detail page with protected download link
- Protected PDF and Office file previews
- Admin overview
- Admin files, users, and access group screens
- Admin file binary replacement through signed upload URLs
- Supabase SSR client helpers
- Initial Postgres schema, RLS policies, and seed records

Planned next:

- Demo auth user creation script
- Screenshots and live demo

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=archive-files
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

Apply the initial migration in `supabase/migrations`.

For local development with the Supabase CLI:

```bash
supabase start
supabase db reset
```

Then seed demo archive records:

```bash
supabase db reset
```

The initial seed inserts example access groups and file records. It does not
create auth users yet; use the signup screen, then promote a user to admin in
the `profiles` table while developing.

## Security Model

The template uses four core concepts:

```txt
profiles
access_groups
member_access_groups
archive_files
archive_file_access_groups
```

Access works like this:

1. A user signs in through Supabase Auth.
2. The user gets a `profiles` row.
3. Admins attach that profile to one or more access groups.
4. Files are attached to one or more access groups.
5. RLS only exposes published files where the signed-in user belongs to a
   matching group.
6. `/api/downloads/[fileId]` checks the same access model before creating a
   short-lived signed Storage URL.

The app never exposes raw private storage paths as public URLs.

## Search And Previews

The template includes a generic search spine:

- `archive_files.search_vector` for title, filename, and description search.
- `file_text_chunks.search_vector` for extracted document text.
- RLS policies on both tables, so search results stay scoped to the signed-in
  user.

The preview route at `/api/previews/[fileId]` uses the same row visibility model
as downloads. PDF files stream inline. Office files are converted to PDF when
LibreOffice is available, otherwise modern Office files use a lightweight
HTML/text fallback through `officeparser`.

## Admin Replacement Uploads

Admins can replace a file binary without exposing the service role key to the
browser:

1. The server verifies admin access and creates a signed upload URL.
2. The browser uploads directly to the private Storage bucket.
3. The server checks the uploaded object metadata.
4. The file row is updated with filename, MIME type, size, storage path, and
   optional SHA-256 hash.
5. An audit event records the replacement.

## Repository Shape

```txt
app/
  (auth)/
  (archive)/
  admin/
  api/downloads/[fileId]/
  api/previews/[fileId]/

components/
  admin/
  archive/
  auth/
  files/
  shell/
  ui/

lib/
  access/
  auth/
  files/
  preview/
  search/
  storage/
  supabase/

supabase/
  config.toml
  migrations/
  seed.sql
  tests/
```

## Notes For Production Use

- Keep `SUPABASE_SECRET_KEY` server-only.
- Use publishable keys for browser and SSR clients.
- Keep the Storage bucket private.
- Keep RLS enabled on all public tables.
- Avoid authorization decisions based on user-editable metadata.
- Treat the admin screens as a starting point, not a finished CMS.
- Install LibreOffice and set `SOFFICE_BIN` if you want high-fidelity Office
  previews in production.

## License

MIT.
