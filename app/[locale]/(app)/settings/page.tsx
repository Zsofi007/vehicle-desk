import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/lib/i18n";
import { getCurrentUserWithRole, requireAuth, requireActiveOrganization } from "@/lib/auth";
import { redirect } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { CompanyNameField } from "@/components/CompanyNameField";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationToggle } from "@/components/NotificationToggle";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;

  const user = await requireAuth(locale);
  const current = await getCurrentUserWithRole();
  const t = await getTranslations("settings");

  if (current?.role === "admin") {
    redirect({ href: "/admin/invites", locale });
  }

  const { organization } = await requireActiveOrganization(locale);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language,email_notifications,company_name")
    .eq("id", user.id)
    .maybeSingle();

  const preferred_language =
    (profile?.preferred_language as "en" | "hu" | "ro" | undefined) ?? "en";
  const email_notifications = Boolean(profile?.email_notifications ?? true);
  const company_name = String(organization.name ?? "");
  const canEditCompany = organization.role === "owner" || organization.role === "admin";

  const showMembers = organization.role === "owner";
  const members = showMembers
    ? await (async () => {
        const admin = createSupabaseAdminClient();
        const { data: rows } = await admin
          .from("organization_members")
          .select("user_id,role,created_at")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: true });

        const ids = Array.from(new Set((rows ?? []).map((r) => String(r.user_id))));
        const { data: profiles } = ids.length
          ? await admin.from("profiles").select("id,email").in("id", ids)
          : { data: [] as Array<{ id: string; email: string | null }> };

        const emailById = new Map((profiles ?? []).map((p) => [String(p.id), p.email]));
        return (rows ?? []).map((r) => ({
          user_id: String(r.user_id),
          role: String(r.role),
          email: String(emailById.get(String(r.user_id)) ?? "—"),
        }));
      })()
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">{t("companyTitle")}</h2>
        <div className="mt-3">
          <CompanyNameField
            value={company_name}
            label={t("companyLabel")}
            placeholder={t("companyPlaceholder")}
            saveLabel={t("companySave")}
            savedLabel={t("companySaved")}
            canEdit={canEditCompany}
          />
        </div>
      </section>

      {showMembers ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">{t("membersTitle")}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-3 py-2">{t("membersEmail")}</th>
                  <th className="px-3 py-2">{t("membersRole")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(members ?? []).map((m) => {
                  const email = String((m as any).email ?? "—");
                  const role = String((m as any).role ?? "member");
                  const isYou = String((m as any).user_id) === user.id;
                  const roleLabel =
                    role === "owner"
                      ? t("orgRole_owner")
                      : role === "admin"
                        ? t("orgRole_admin")
                        : t("orgRole_member");
                  return (
                    <tr key={`${m.user_id}:${role}`}>
                      <td className="px-3 py-2 text-stone-900">
                        {email}
                        {isYou ? (
                          <span className="text-stone-500"> ({t("membersYou")})</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-stone-700">{roleLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">{t("exportTitle")}</h2>
        <p className="mt-1 text-sm text-stone-600">{t("exportHint")}</p>
        <div className="mt-3">
          <a
            href="/api/export"
            className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            {t("exportButton")}
          </a>
        </div>
      </section>
    </div>
  );
}

