import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/lib/i18n";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationToggle } from "@/components/NotificationToggle";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;

  const user = await requireAuth(locale);
  const t = await getTranslations("settings");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language,email_notifications")
    .eq("id", user.id)
    .maybeSingle();

  const preferred_language =
    (profile?.preferred_language as "en" | "hu" | "ro" | undefined) ?? "en";
  const email_notifications = Boolean(profile?.email_notifications ?? true);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">{t("languageTitle")}</h2>
        <div className="mt-3">
          <LanguageSelector
            value={preferred_language}
            label={t("languageLabel")}
          />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">
          {t("notificationsTitle")}
        </h2>
        <div className="mt-3">
          <NotificationToggle
            value={email_notifications}
            label={t("emailNotificationsLabel")}
            hint={t("emailNotificationsHint")}
            onLabel={t("toggleOn")}
            offLabel={t("toggleOff")}
          />
        </div>
      </section>
    </div>
  );
}

