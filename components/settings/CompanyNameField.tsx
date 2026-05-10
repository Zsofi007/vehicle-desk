"use client";

import { useId, useRef, useState, useTransition } from "react";

import { updateOrganizationName } from "@/lib/actions/org-settings";
import { useRouter } from "@/lib/navigation";

type Props = {
  value: string;
  label: string;
  placeholder?: string;
  saveLabel: string;
  savedLabel: string;
  canEdit?: boolean;
};

export function CompanyNameField({
  value,
  label,
  placeholder,
  saveLabel,
  savedLabel,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);
  const [saved, setSaved] = useState(false);
  const baselineRef = useRef(value);
  const id = useId();

  const next = current.trim();
  const isDirty = next !== value.trim();

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id={id}
          name="company_name"
          type="text"
          autoComplete="organization"
          placeholder={placeholder}
          className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setSaved(false);
          }}
          disabled={pending || !canEdit}
        />
        {canEdit ? (
          <button
            type="button"
            disabled={pending || !isDirty}
            onClick={() => {
              setSaved(false);
              startTransition(async () => {
                await updateOrganizationName(current);
                baselineRef.current = current;
                router.refresh();
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1400);
              });
            }}
            className={[
              "inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium shadow-sm",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600",
              pending ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50",
              saved
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                : "border-slate-200 bg-white text-slate-900",
            ].join(" ")}
          >
            {saved ? savedLabel : saveLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

