import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/auth/LoginForm";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const t = await getTranslations("auth");
  const tNav = await getTranslations("nav");
  const tDemo = await getTranslations("demo");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            {t("loginTitle")}
          </h1>
          <p className="mt-2 text-sm text-stone-600">{t("loginSubtitle")}</p>
        </div>
        <LanguageSwitcher ariaLabel={tNav("language")} persistPreference={false} />
      </div>
      <LoginForm locale={locale} />
      <p className="mt-6 border-t border-stone-100 pt-6 text-center text-sm text-stone-600">
        <Link href="/demo" className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700">
          {tDemo("browseDemo")}
        </Link>
      </p>
    </div>
  );
}
