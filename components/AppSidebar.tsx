"use client";

import { useMemo } from "react";

import { Link, usePathname } from "@/lib/navigation";
import type { AppLocale } from "@/lib/i18n";

export type AppNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  locale: AppLocale;
  items: AppNavItem[];
  title: string;
  subtitle: string;
  footerItems?: AppNavItem[];
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  locale,
  items,
  title,
  subtitle,
  footerItems,
  onNavigate,
}: Props) {
  const pathname = usePathname();

  const allItems = useMemo(
    () => [
      ...items,
      ...(footerItems ? [{ href: "", label: "", icon: null }] : []),
      ...(footerItems ?? []),
    ],
    [items, footerItems],
  );

  return (
    <div className="flex h-full min-h-0 flex-col py-6">
      <div className="px-6 pb-6">
        <Link
          href="/dashboard"
          locale={locale}
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="grid h-8 w-8 place-items-center rounded bg-slate-800 text-white">
            <span aria-hidden className="text-sm">
              VD
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </div>
            <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {subtitle}
            </div>
          </div>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {allItems.map((item) => {
          if (item.href === "" && footerItems) {
            return (
              <div
                key="footer-separator"
                className="my-3 border-t border-slate-200"
              />
            );
          }

          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <span aria-hidden className="text-slate-500">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
