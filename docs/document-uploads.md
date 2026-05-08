# Document uploads (Phase 7 foundation)

This phase adds a **minimal, organization-scoped** document attachment system for:
- `expiry_items`
- `maintenance_records`

Supported file types:
- PDF (`application/pdf`)
- Images (`image/jpeg`, `image/png`, `image/webp`)

Limit:
- **Max 5 MB** per file

## How it works

### Storage (Supabase Storage)
- Bucket: `org-documents` (**private**)
- Object key format:
  - `org/<organization_id>/<kind>/<parent_id>/<document_id>.<ext>`
  - `kind` is `expiry` or `maintenance`

### Metadata (Postgres)
We store metadata in `public.documents`:
- Which org owns the document (`organization_id`)
- What it’s attached to (`expiry_item_id` or `maintenance_record_id`)
- Where it lives in Storage (`bucket_id`, `object_path`)
- File details (`filename`, `content_type`, `size_bytes`)

RLS ensures users can only `SELECT/INSERT/DELETE` rows for orgs they’re a member of.

### Upload flow (client + server)
1. Client validates file (type + size).
2. Server Action `createDocumentMetadata(...)`:
   - Validates the parent belongs to the user’s org
   - Creates the `documents` row (reserving a `document_id` + `object_path`)
3. Client uploads the file to Storage using the browser Supabase client.

### Download flow (signed URLs)
Downloads use **short-lived signed URLs** created server-side:
- Server Action `getDocumentSignedUrl(documentId)` checks access (via RLS) then uses the service role client to call `storage.createSignedUrl`.

### Delete flow
Deleting a document:
- Removes the Storage object via service role client
- Deletes the metadata row (`public.documents`) via RLS

## Parent delete behavior (no orphaned blobs)

Deleting an `expiry_item` or `maintenance_record` cascades and removes `public.documents` rows, but Storage objects would be orphaned.

To prevent that:
- A `BEFORE DELETE` trigger on the parent record enqueues the objects into `public.document_deletions_queue`.
- The existing delete actions call `processDocumentDeletionQueueForParent(...)` after deleting the parent, which:
  - Removes queued Storage objects (service role)
  - Deletes processed queue rows

This gives us “trigger-based cleanup” without requiring Postgres to directly delete Storage objects.

## Where the code lives
- DB migration: `supabase/migrations/20260508131000_documents_storage.sql`
- Server actions: `lib/actions/documents.ts`
- UI: `components/DocumentsInline.tsx` (used from the editable expiry/maintenance lists)

## Manual QA checklist
- Upload a PDF to an expiry item; it appears in the list and downloads.
- Upload a PNG/JPG/WEBP to a maintenance record; it appears and downloads.
- Delete a document; verify it disappears from list and can no longer be downloaded.
- Delete an expiry item / maintenance record with docs; verify:
  - documents disappear from UI
  - objects are removed from Storage (no orphaned paths left)
- Cross-org: user in org A cannot list/download/delete org B documents.

