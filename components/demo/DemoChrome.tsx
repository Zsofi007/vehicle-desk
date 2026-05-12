"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/lib/navigation";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";

type Props = {
  children: React.ReactNode;
};

export function DemoChrome({ children }: Props) {
  const t = useTranslations("demo");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-[#fbf8fa] text-slate-900">
      <div
        role="status"
        className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950"
      >
        {t("banner")}
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="truncate text-base font-semibold text-slate-900 hover:text-slate-700"
            >
              {tCommon("appName")}
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
              <Link href="/demo" className="hover:text-slate-900 hover:underline">
                {t("navDashboard")}
              </Link>
              <Link href="/demo/vehicles" className="hover:text-slate-900 hover:underline">
                {tNav("vehicles")}
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher ariaLabel={tNav("language")} persistPreference={false} />
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 text-center md:px-8">
          <p className="max-w-xl text-sm text-slate-600">{t("footerHint")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {t("ctaPrimary")}
            </Link>
            <a
              href={`mailto:${t("requestAccessEmail")}`}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
