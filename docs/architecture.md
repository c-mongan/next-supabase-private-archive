# Architecture

## Request Flow

```mermaid
flowchart LR
  User["Signed-in member"] --> Page["Archive page"]
  User --> Search["Search page"]
  Page --> RLS["Supabase RLS"]
  Search --> RLS
  RLS --> Files["Visible file rows"]
  User --> Route["/api/downloads/:fileId"]
  Route --> Check["can_download_file(auth.uid(), fileId)"]
  Check --> SignedUrl["Short-lived signed URL"]
  SignedUrl --> Storage["Private Storage bucket"]
  User --> Preview["/api/previews/:fileId"]
  Preview --> RLS
  Preview --> Storage
  Admin["Admin"] --> Upload["Signed replacement upload"]
  Upload --> Storage
  Upload --> Metadata["Verified file metadata update"]
```

## Design Choices

- The application route handles downloads so storage URLs are not the access
  boundary.
- The database function derives the caller from `auth.uid()` so callers cannot
  ask whether a different user can access a file.
- The `visible_archive_files` view uses `security_invoker = true` so it follows
  the querying user's RLS policies.
- Admin behavior is represented by `profiles.role = 'admin'` rather than
  user-editable auth metadata.
- Search is implemented with generated Postgres `tsvector` columns and RLS,
  matching Supabase's documented full-text-search approach.
- Replacement uploads use Supabase Storage signed upload URLs so browser uploads
  do not require service role credentials.

## Extraction Boundary

This starter is designed to be reusable. It should avoid:

- Client-specific naming
- Real client data
- Multi-tenant complexity
- Billing
- AI features
- A generic page-builder CMS

The useful template is the access-controlled archive spine.
