import type { AppLocale } from "@/lib/i18n";
import { getCurrentUserWithRole, requireAuth, requireActiveOrganization } from "@/lib/auth";
import { redirect } from "@/lib/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";

import { InviteForm } from "@/components/admin/invites/InviteForm";
import { InviteList, type InviteListItem } from "@/components/admin/invites/InviteList";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminInvitesPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;

  await requireAuth(locale);
  const current = await getCurrentUserWithRole();
  const isGlobalAdmin = current?.role === "admin";
  const organization = isGlobalAdmin ? null : (await requireActiveOrganization(locale)).organization;
  const isOrgAdmin = organization ? organization.role === "owner" || organization.role === "admin" : false;
  if (!isGlobalAdmin && !isOrgAdmin) redirect({ href: "/dashboard", locale });

  const admin = createSupabaseAdminClient();
  const invitesQuery = admin
    .from("invites")
    .select("id,email,used,expires_at,created_at")
    .order("created_at", { ascending: false });

  const { data } = isGlobalAdmin
    ? await invitesQuery.is("organization_id", null)
    : await invitesQuery.eq("organization_id", organization!.id);

  const invites = (data ?? []) as InviteListItem[];

  const tInvites = await getTranslations("invites");
  const tAdmin = await getTranslations("admin");

  let orgOverview: React.ReactNode = null;
  if (isGlobalAdmin) {
    const tSettings = await getTranslations("settings");
    const { data: orgs } = await admin
      .from("organizations")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    const { data: ownerRows } = await admin
      .from("organization_members")
      .select("organization_id,user_id")
      .eq("role", "owner");

    const ownerIds = Array.from(
      new Set((ownerRows ?? []).map((o) => String(o.user_id))),
    );
    const { data: ownerProfiles } = ownerIds.length
      ? await admin.from("profiles").select("id,email").in("id", ownerIds)
      : { data: [] as Array<{ id: string; email: string | null }> };

    const emailByUserId = new Map(
      (ownerProfiles ?? []).map((p) => [String(p.id), p.email]),
    );
    const ownersByOrgId = new Map<string, string[]>();
    for (const row of ownerRows ?? []) {
      const orgId = String(row.organization_id);
      const email = String(emailByUserId.get(String(row.user_id)) ?? "—");
      const arr = ownersByOrgId.get(orgId) ?? [];
      arr.push(email);
      ownersByOrgId.set(orgId, arr);
    }

    orgOverview = (
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">
          {tSettings("orgOverviewTitle")}
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-3 py-2">{tSettings("orgOverviewOrg")}</th>
                <th className="px-3 py-2">{tSettings("orgOverviewOwners")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(orgs ?? []).map((org) => {
                const orgId = String(org.id);
                const ownerEmails = ownersByOrgId.get(orgId) ?? [];
                return (
                  <tr key={orgId}>
                    <td className="px-3 py-2 text-stone-900">
                      {String(org.name ?? "—")}
                    </td>
                    <td className="px-3 py-2 text-stone-700">
                      {ownerEmails.length > 0 ? ownerEmails.join(", ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          {tAdmin("pageTitle")}
        </h1>
      </header>

      {orgOverview}

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">{tAdmin("sectionCreateTitle")}</h2>
        <InviteForm
          buttonLabel={isGlobalAdmin ? tInvites("inviteOrgOwner") : tInvites("createInvite")}
          exposeCreatedToken={isGlobalAdmin}
        />
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">{tAdmin("sectionListTitle")}</h2>
        <InviteList locale={locale} invites={invites} />
      </section>
    </div>
  );
}

