"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { GB, HU, RO } from "country-flag-icons/react/3x2";

import type { AppLocale } from "@/lib/i18n";
import { usePathname, useRouter } from "@/lib/navigation";
import { updatePreferredLanguage } from "@/lib/actions/profile";
import { cn } from "@/lib/cn";

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
  const [open, setOpen] = useState(false);

  const localeFlag: Record<"en" | "hu" | "ro", React.ComponentType<{ className?: string }>> =
    {
      en: GB,
      hu: HU,
      ro: RO,
    };
  const ActiveFlag = localeFlag[current];

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-stone-800">{label}</label>
      <div className="relative w-full max-w-xs">
        <button
          type="button"
          disabled={pending}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onBlur={(e) => {
            const nextFocused = e.relatedTarget as Node | null;
            if (nextFocused && e.currentTarget.parentElement?.contains(nextFocused)) return;
            setOpen(false);
          }}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ActiveFlag className="h-3.5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
            <span className="truncate">{options.find((o) => o.value === current)?.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
        </button>

        {open ? (
          <div
            role="menu"
            aria-label={label}
            className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg"
          >
            {options.map((o) => {
              const Flag = localeFlag[o.value];
              const isActive = o.value === current;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                    isActive ? "bg-stone-50 text-stone-900" : "text-stone-700 hover:bg-stone-50",
                  )}
                  onClick={() => {
                    const next = o.value;
                    setCurrent(next);
                    setOpen(false);
                    startTransition(async () => {
                      await updatePreferredLanguage(next);
                      router.replace(pathname, { locale: next as AppLocale });
                    });
                  }}
                >
                  <Flag className="h-3.5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                  <span className="flex-1">{o.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

