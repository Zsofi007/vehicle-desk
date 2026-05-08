"use client";

import { useMemo, useState } from "react";
import { Building2, Check } from "lucide-react";

import { useRouter } from "@/lib/navigation";
import { setActiveOrganization } from "@/lib/actions/organizations";

type Org = {
  id: string;
  name: string;
};

type Props = {
  ariaLabel: string;
  activeOrganizationId: string;
  organizations: Org[];
};

export function OrganizationSwitcher({
  ariaLabel,
  activeOrganizationId,
  organizations,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const active = useMemo(
    () => organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0],
    [organizations, activeOrganizationId],
  );

  if (!active) return null;
  if (organizations.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm md:inline-flex">
        <Building2 className="h-4 w-4 text-slate-600" aria-hidden />
        <span className="max-w-[14rem] truncate">{active.name}</span>
      </div>
    );
  }

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
          if (nextFocused && e.currentTarget.parentElement?.contains(nextFocused)) return;
          setOpen(false);
        }}
        className="inline-flex h-10 max-w-[16rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
      >
        <Building2 className="h-4 w-4 text-slate-600" aria-hidden />
        <span className="truncate">{active.name}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={ariaLabel}
          className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg"
        >
          {organizations.map((org) => {
            const isActive = org.id === activeOrganizationId;
            return (
              <button
                key={org.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setOpen(false);
                  void setActiveOrganization(org.id).then(() => {
                    router.refresh();
                  });
                }}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  isActive ? "bg-stone-50 text-stone-900" : "text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                <span className="flex-1 truncate">{org.name}</span>
                {isActive ? <Check className="h-4 w-4 text-slate-600" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

