"use client";

import { useState, useTransition } from "react";

import type { AppLocale } from "@/lib/i18n";
import { usePathname, useRouter } from "@/lib/navigation";
import { updatePreferredLanguage } from "@/lib/actions/profile";

type Props = {
  value: "en" | "hu" | "ro";
  label: string;
};

const options: Array<{ value: "en" | "hu" | "ro"; label: string }> = [
  { value: "en", label: "English" },
  { value: "hu", label: "Magyar" },
  { value: "ro", label: "Română" },
];

export function LanguageSelector({ value, label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-stone-800">{label}</label>
      <div className="flex items-center gap-3">
        <select
          value={current}
          onChange={(e) => {
            const next = e.target.value as "en" | "hu" | "ro";
            setCurrent(next);
            startTransition(async () => {
              await updatePreferredLanguage(next);
              router.replace(pathname, { locale: next as AppLocale });
            });
          }}
          className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

