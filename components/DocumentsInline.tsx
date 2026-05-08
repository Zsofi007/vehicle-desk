"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Paperclip, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppLocale } from "@/lib/i18n";
import {
  createDocumentMetadata,
  deleteDocument,
  getDocumentSignedUrl,
  listDocumentsForParent,
  type DocumentRow,
} from "@/lib/actions/documents";

type Props = {
  locale: AppLocale;
  kind: "expiry" | "maintenance";
  parentId: string;
};

const maxBytes = 5 * 1024 * 1024;
const allowedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function formatBytes(n: number) {
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentsInline({ locale, kind, parentId }: Props) {
  const t = useTranslations("documents");
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const accept = useMemo(() => {
    // Accept is a hint for file pickers; we still validate by content-type + size.
    return ["application/pdf", "image/jpeg", "image/png", "image/webp"].join(",");
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await listDocumentsForParent(kind, parentId);
    if ("error" in res) {
      setError(res.error ?? "error");
      setLoading(false);
      return;
    }
    setDocs(res.documents);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, parentId]);

  return (
    <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md text-left text-sm font-medium text-stone-900 hover:text-stone-950"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
            aria-hidden
          />
          <span>{t("title")}</span>
          {!loading && docs.length > 0 ? (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
              {docs.length}
            </span>
          ) : null}
        </button>

        <div className="flex items-center gap-2">
          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const inputEl = e.currentTarget;
              const file = e.currentTarget.files?.[0] ?? null;
              if (!file) return;

              void (async () => {
                setUploading(true);
                try {
                  setUploadError(null);

                  if (file.size > maxBytes) {
                    setUploadError("too_large");
                    inputEl.value = "";
                    return;
                  }
                  if (!allowedContentTypes.has(file.type)) {
                    setUploadError("unsupported_type");
                    inputEl.value = "";
                    return;
                  }

                  const metaRes = await createDocumentMetadata(kind, parentId, locale, {
                    filename: file.name,
                    contentType: file.type,
                    sizeBytes: file.size,
                  });
                  if (!("ok" in metaRes) || !metaRes.ok) {
                    setUploadError("upload_failed");
                    inputEl.value = "";
                    return;
                  }

                  // Optimistically show the document immediately.
                  setDocs((prev) => [metaRes.document, ...prev]);
                  setOpen(true);

                  const supabase = createSupabaseBrowserClient();
                  const uploadRes = await supabase.storage
                    .from(metaRes.document.bucket_id)
                    .upload(metaRes.document.object_path, file, {
                      upsert: false,
                      contentType: file.type,
                    });

                  if (uploadRes.error) {
                    await deleteDocument(metaRes.document.id, locale);
                    setUploadError("upload_failed");
                    inputEl.value = "";
                    // Remove optimistic row (it still exists in DB, but deleteDocument should remove it).
                    setDocs((prev) => prev.filter((d) => d.id !== metaRes.document.id));
                    return;
                  }

                  inputEl.value = "";
                  await refresh();
                } finally {
                  setUploading(false);
                }
              })();
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-4 w-4" aria-hidden />
            {t("upload")}
          </Button>
        </div>
      </div>

      {!open ? null : (
        <>
      {uploadError === "too_large" ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t("errorTooLarge")}
        </p>
      ) : uploadError === "unsupported_type" ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t("errorUnsupportedType")}
        </p>
      ) : uploadError === "upload_failed" ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t("errorUploadFailed")}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {t("errorLoadFailed")}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-2 text-sm text-stone-600">{t("loading")}</p>
      ) : docs.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">{t("empty")}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900">{d.filename}</p>
                <p className="text-xs text-stone-600">
                  {formatBytes(d.size_bytes)} · {d.content_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label={t("download")}
                  className="h-9 w-9"
                  disabled={uploading}
                  onClick={() => {
                    void (async () => {
                      const res = await getDocumentSignedUrl(d.id);
                      if (!("ok" in res) || !res.ok) return;
                      window.open(res.url, "_blank", "noopener,noreferrer");
                    })();
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden />
                </Button>

                <ConfirmDeleteDialog
                  trigger={
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      aria-label={t("delete")}
                      className="h-9 w-9"
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  }
                  onConfirm={async () => {
                    await deleteDocument(d.id, locale);
                    await refresh();
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
        </>
      )}
    </div>
  );
}

