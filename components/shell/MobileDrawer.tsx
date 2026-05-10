"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePathname } from "@/lib/navigation";

type Props = {
  buttonLabel: string;
  children: React.ReactNode;
};

export function MobileDrawer({ buttonLabel, children }: Props) {
  const t = useTranslations("aria");
  const pathname = usePathname();
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const open = openedAtPath === pathname;

  return (
    <>
      <button
        type="button"
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenedAtPath(pathname)}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("navigationPanelTitle")}
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label={t("closeNavigation")}
            onClick={() => setOpenedAtPath(null)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(18rem,100vw)] max-w-full flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl">
            <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2">
              <div className="text-sm font-semibold text-slate-900">
                {t("navigationPanelTitle")}
              </div>
              <button
                type="button"
                aria-label={t("closeNavigation")}
                onClick={() => setOpenedAtPath(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
