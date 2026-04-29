"use client";

import { useState, useTransition } from "react";

import { updateEmailNotifications } from "@/lib/actions/profile";

type Props = {
  value: boolean;
  label: string;
  hint?: string;
  onLabel: string;
  offLabel: string;
};

export function NotificationToggle({ value, label, hint, onLabel, offLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(value);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-stone-800">{label}</label>
      {hint ? <p className="text-sm text-stone-600">{hint}</p> : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            startTransition(async () => {
              await updateEmailNotifications(next);
            });
          }}
          disabled={pending}
          className={[
            "inline-flex h-10 w-16 items-center rounded-full border px-1 transition-colors",
            enabled ? "border-emerald-300 bg-emerald-100" : "border-slate-200 bg-slate-100",
            pending ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
          aria-pressed={enabled}
        >
          <span
            className={[
              "h-8 w-8 rounded-full bg-white shadow-sm transition-transform",
              enabled ? "translate-x-6" : "translate-x-0",
            ].join(" ")}
          />
        </button>
        <span className="text-sm text-stone-700">{enabled ? onLabel : offLabel}</span>
      </div>
    </div>
  );
}

