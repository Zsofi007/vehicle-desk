import { getTranslations } from "next-intl/server";

import { SignupForm } from "@/components/SignupForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { AppLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignupPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const t = await getTranslations("auth");
  const tNav = await getTranslations("nav");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            {t("signupTitle")}
          </h1>
          <p className="mt-2 text-sm text-stone-600">{t("signupSubtitle")}</p>
        </div>
        <LanguageSwitcher ariaLabel={tNav("language")} />
      </div>
      <SignupForm locale={locale} />
    </div>
  );
}
