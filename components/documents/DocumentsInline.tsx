"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Paperclip, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
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
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await listDocumentsForParent(kind, parentId);
      if (cancelled) return;
      if ("error" in res) {
        setError(res.error ?? "error");
        setLoading(false);
        return;
      }
      setDocs(res.documents);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, parentId]);

  async function onUploadFile(file: File) {
    setUploadError(null);

    if (!allowedContentTypes.has(file.type)) {
      setUploadError("type");
      return;
    }
    if (file.size > maxBytes) {
      setUploadError("size");
      return;
    }

    setUploading(true);
    try {
      const metaRes = await createDocumentMetadata(kind, parentId, locale, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      if ("error" in metaRes) {
        setUploadError(metaRes.error ?? "error");
        return;
      }

      const created = metaRes.document;
      setDocs((prev) => [created, ...prev]);

      const supabase = createSupabaseBrowserClient();
      const { error: uploadErr } = await supabase.storage
        .from("org-documents")
        .upload(created.object_path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        setDocs((prev) => prev.filter((d) => d.id !== created.id));
        setUploadError("upload");
        return;
      }

      await refresh();
    } finally {
      setUploading(false);
    }
  }

  if (!open) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 w-full items-center justify-between gap-2 py-1 text-left"
        >
          <span className="text-sm font-medium text-stone-900">{t("title")}</span>
          <span className="inline-flex items-center gap-2 text-sm text-stone-700">
            <span className="tabular-nums">{docs.length}</span>
            <ChevronDown className="h-4 w-4" aria-hidden />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-stone-900">{t("title")}</p>
        <Button type="button" size="sm" variant="secondary" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
          {t("collapse")}
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        {error ? (
          <p className="text-sm text-red-800" role="alert">
            {t("errorLoadFailed")}
          </p>
        ) : null}
        {uploadError ? (
          <p className="text-sm text-red-800" role="alert">
            {uploadError === "type"
              ? t("errorUnsupportedType")
              : uploadError === "size"
                ? t("errorTooLarge")
                : t("errorUploadFailed")}
          </p>
        ) : null}

        <div className="grid gap-2">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={uploading}
            onChange={async (e) => {
              const inputEl = e.currentTarget;
              const f = inputEl.files?.[0];
              inputEl.value = "";
              if (!f) return;
              await onUploadFile(f);
            }}
            className="sr-only"
          />
          <Button
            type="button"
            size="default"
            variant="secondary"
            disabled={uploading}
            className="w-full sm:w-auto"
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            <Paperclip className="h-4 w-4" aria-hidden />
            {uploading ? `${t("upload")}…` : t("upload")}
          </Button>
          <p className="text-xs text-stone-600">
            {t("limits", { max: formatBytes(maxBytes) })}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-600">{t("loading")}</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-stone-600">{t("empty")}</p>
        ) : (
          <ul className="grid gap-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:py-2"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-stone-900">
                    <Paperclip className="h-4 w-4 shrink-0 text-stone-600" aria-hidden />
                    <span className="truncate">{doc.filename}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-stone-600 tabular-nums">
                    {formatBytes(doc.size_bytes)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full justify-center sm:w-auto"
                    onClick={async () => {
                      const res = await getDocumentSignedUrl(doc.id);
                      if ("error" in res) return;
                      window.open(res.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {t("download")}
                  </Button>
                  <ConfirmDeleteDialog
                    description={t("deleteConfirm")}
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="w-full justify-center sm:w-auto"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {t("delete")}
                      </Button>
                    }
                    onConfirm={async () => {
                      const res = await deleteDocument(doc.id, locale);
                      if ("error" in res) return;
                      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

