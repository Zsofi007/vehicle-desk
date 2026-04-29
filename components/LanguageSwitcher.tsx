"use client";

import { useLocale } from "next-intl";
import { GB, HU, RO } from "country-flag-icons/react/3x2";
import { useMemo, useState } from "react";

import { locales, localeLabel, type AppLocale } from "@/lib/i18n";
import { usePathname, useRouter } from "@/lib/navigation";

type Props = {
  ariaLabel: string;
};

const localeFlag: Record<AppLocale, React.ComponentType<{ className?: string }>> =
  {
    en: GB,
    hu: HU,
    ro: RO,
  };

export function LanguageSwitcher({ ariaLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const active = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);

  const ActiveFlag = localeFlag[active];
  const activeLabel = useMemo(() => localeLabel(active), [active]);

  return (
    <div className="relative">
      <span className="sr-only">{ariaLabel}</span>

      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          const nextFocused = e.relatedTarget as Node | null;
          if (nextFocused && e.currentTarget.parentElement?.contains(nextFocused))
            return;
          setOpen(false);
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
      >
        <ActiveFlag
          className="h-4 w-6 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
          aria-label={activeLabel}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={ariaLabel}
          className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg"
        >
          {locales.map((loc) => {
            const Flag = localeFlag[loc];
            const label = localeLabel(loc);
            const isActive = loc === active;

            return (
              <button
                key={loc}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setOpen(false);
                  router.replace(pathname, { locale: loc });
                }}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  isActive
                    ? "bg-stone-50 text-stone-900"
                    : "text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                <Flag className="h-3.5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                <span className="flex-1">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
