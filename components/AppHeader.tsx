import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/navigation";
import type { AppLocale } from "@/lib/i18n";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutForm } from "./LogoutForm";

type Props = {
  locale: AppLocale;
};

export async function AppHeader({ locale }: Props) {
  const tNav = await getTranslations("nav");
  const tAria = await getTranslations("aria");
  const tCommon = await getTranslations("common");

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-stone-900"
          >
            {tCommon("appName")}
          </Link>
          <nav aria-label={tAria("mainNavigation")} className="flex gap-6 text-sm">
            <Link
              href="/dashboard"
              className="text-stone-700 underline-offset-4 hover:underline focus-visible:underline"
            >
              {tNav("dashboard")}
            </Link>
            <Link
              href="/vehicles"
              className="text-stone-700 underline-offset-4 hover:underline focus-visible:underline"
            >
              {tNav("vehicles")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher ariaLabel={tNav("language")} />
          <LogoutForm locale={locale} label={tNav("logout")} />
        </div>
      </div>
    </header>
  );
}
