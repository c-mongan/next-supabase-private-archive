# Architecture

## Request Flow

```mermaid
flowchart LR
  User["Signed-in member"] --> Page["Archive page"]
  Page --> RLS["Supabase RLS"]
  RLS --> Files["Visible file rows"]
  User --> Route["/api/downloads/:fileId"]
  Route --> Check["can_download_file(auth.uid(), fileId)"]
  Check --> SignedUrl["Short-lived signed URL"]
  SignedUrl --> Storage["Private Storage bucket"]
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

## Extraction Boundary

This starter is designed to be reusable. It should avoid:

- Client-specific naming
- Real client data
- Multi-tenant complexity
- Billing
- AI features
- A generic page-builder CMS

The useful template is the access-controlled archive spine.
