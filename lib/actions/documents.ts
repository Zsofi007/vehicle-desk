"use server";

import "server-only";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";

const bucketId = "org-documents";

const kindSchema = z.enum(["expiry", "maintenance"]);

const createSchema = z.object({
  kind: kindSchema,
  parentId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
});

export type DocumentRow = {
  id: string;
  organization_id: string;
  kind: "expiry" | "maintenance";
  expiry_item_id: string | null;
  maintenance_record_id: string | null;
  bucket_id: string;
  object_path: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  created_by: string | null;
};

function extFromFilename(filename: string) {
  const i = filename.lastIndexOf(".");
  if (i === -1) return "";
  return filename.slice(i + 1).trim().toLowerCase();
}

const allowedExt = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const allowedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function resolveOrgForParent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  kind: "expiry" | "maintenance",
  parentId: string,
): Promise<string | null> {
  if (kind === "expiry") {
    const { data, error } = await supabase
      .from("expiry_items")
      .select(
        `
        id,
        vehicle:vehicles (
          organization_id
        )
      `,
      )
      .eq("id", parentId)
      .maybeSingle();
    if (error) return null;
    const orgId = (data as { vehicle?: { organization_id?: string | null } | null } | null)
      ?.vehicle?.organization_id ?? null;
    return orgId ? String(orgId) : null;
  }

  const { data, error } = await supabase
    .from("maintenance_records")
    .select(
      `
      id,
      vehicle:vehicles (
        organization_id
      )
    `,
    )
    .eq("id", parentId)
    .maybeSingle();
  if (error) return null;
  const orgId = (data as { vehicle?: { organization_id?: string | null } | null } | null)
    ?.vehicle?.organization_id ?? null;
  return orgId ? String(orgId) : null;
}

export async function listDocumentsForParent(kind: "expiry" | "maintenance", parentId: string) {
  const parsed = z.object({ kind: kindSchema, parentId: z.string().uuid() }).safeParse({
    kind,
    parentId,
  });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const filter =
    kind === "expiry" ? { expiry_item_id: parentId } : { maintenance_record_id: parentId };

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id,kind,expiry_item_id,maintenance_record_id,bucket_id,object_path,filename,content_type,size_bytes,created_at,created_by,organization_id",
    )
    .match(filter)
    .order("created_at", { ascending: false });

  if (error) return { error: "error" as const };
  return { ok: true as const, documents: (data ?? []) as DocumentRow[] };
}

export async function createDocumentMetadata(
  kind: "expiry" | "maintenance",
  parentId: string,
  locale: AppLocale,
  input: { filename: string; contentType: string; sizeBytes: number },
) {
  const parsed = createSchema.safeParse({ kind, parentId, ...input });
  if (!parsed.success) return { error: "validation" as const };

  const ext = extFromFilename(parsed.data.filename);
  if (!allowedExt.has(ext)) return { error: "validation" as const };
  if (!allowedContentTypes.has(parsed.data.contentType)) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const organizationId = await resolveOrgForParent(supabase, kind, parentId);
  if (!organizationId) return { error: "forbidden" as const };

  const documentId = crypto.randomUUID();
  const objectPath = `org/${organizationId}/${kind}/${parentId}/${documentId}.${ext}`;

  const payload: Record<string, unknown> = {
    id: documentId,
    organization_id: organizationId,
    kind,
    bucket_id: bucketId,
    object_path: objectPath,
    filename: parsed.data.filename,
    content_type: parsed.data.contentType,
    size_bytes: parsed.data.sizeBytes,
    created_by: user.id,
    ...(kind === "expiry"
      ? { expiry_item_id: parentId }
      : { maintenance_record_id: parentId }),
  };

  const { error } = await supabase.from("documents").insert(payload);
  if (error) return { error: "error" as const };

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {
    ok: true as const,
    document: {
      id: documentId,
      organization_id: organizationId,
      kind,
      expiry_item_id: kind === "expiry" ? parentId : null,
      maintenance_record_id: kind === "maintenance" ? parentId : null,
      bucket_id: bucketId,
      object_path: objectPath,
      filename: parsed.data.filename,
      content_type: parsed.data.contentType,
      size_bytes: parsed.data.sizeBytes,
      created_at: new Date().toISOString(),
      created_by: user.id,
    } satisfies DocumentRow,
  };
}

export async function getDocumentSignedUrl(documentId: string) {
  const parsed = z.object({ documentId: z.string().uuid() }).safeParse({ documentId });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id,bucket_id,object_path,filename")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !doc) return { error: "notFound" as const };

  const bucket = String((doc as { bucket_id?: string | null }).bucket_id ?? "");
  const objectPath = String((doc as { object_path?: string | null }).object_path ?? "");
  const filename = String((doc as { filename?: string | null }).filename ?? "");
  if (!bucket || !objectPath) return { error: "error" as const };

  const admin = createSupabaseAdminClient();
  const { data: signed, error: signedError } = await admin.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);

  if (signedError || !signed?.signedUrl) return { error: "error" as const };
  return { ok: true as const, url: signed.signedUrl, filename };
}

export async function deleteDocument(documentId: string, locale: AppLocale) {
  const parsed = z.object({ documentId: z.string().uuid() }).safeParse({ documentId });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  // Fetch doc via RLS (ensures org access).
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id,bucket_id,object_path")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !doc) return { error: "notFound" as const };

  const bucket = String((doc as { bucket_id?: string | null }).bucket_id ?? "");
  const objectPath = String((doc as { object_path?: string | null }).object_path ?? "");
  if (!bucket || !objectPath) return { error: "error" as const };

  const admin = createSupabaseAdminClient();
  await admin.storage.from(bucket).remove([objectPath]);

  const { error: delError } = await supabase.from("documents").delete().eq("id", documentId);
  if (delError) return { error: "error" as const };

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return { ok: true as const };
}

export async function processDocumentDeletionQueueForParent(params: {
  kind: "expiry" | "maintenance";
  parentId: string;
}) {
  const parsed = z.object({ kind: kindSchema, parentId: z.string().uuid() }).safeParse(params);
  if (!parsed.success) return { error: "validation" as const };

  const admin = createSupabaseAdminClient();

  const { data: rows } = await admin
    .from("document_deletions_queue")
    .select("id,bucket_id,object_path")
    .eq("kind", parsed.data.kind)
    .eq("parent_id", parsed.data.parentId)
    .order("id", { ascending: true });

  const items = (
    (rows as Array<{ id: number; bucket_id: string; object_path: string }> | null | undefined) ??
    []
  ).map((r) => ({
    id: Number(r.id),
    bucketId: String(r.bucket_id),
    objectPath: String(r.object_path),
  }));

  const byBucket = new Map<string, string[]>();
  for (const it of items) {
    const arr = byBucket.get(it.bucketId) ?? [];
    arr.push(it.objectPath);
    byBucket.set(it.bucketId, arr);
  }

  for (const [b, paths] of byBucket.entries()) {
    if (paths.length === 0) continue;
    await admin.storage.from(b).remove(paths);
  }

  if (items.length > 0) {
    await admin.from("document_deletions_queue").delete().in("id", items.map((x) => x.id));
  }

  return { ok: true as const, deleted: items.length };
}

