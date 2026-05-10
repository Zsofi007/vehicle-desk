"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { usePathname } from "@/lib/navigation";

type Props = {
  buttonLabel: string;
  children: React.ReactNode;
};

export function MobileDrawer({ buttonLabel, children }: Props) {
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
        className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpenedAtPath(null)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute left-0 top-0 h-full w-72 overflow-hidden border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                Navigation
              </div>
              <button
                type="button"
                onClick={() => setOpenedAtPath(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}

