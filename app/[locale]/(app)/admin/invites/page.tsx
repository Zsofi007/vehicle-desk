import type { AppLocale } from "@/lib/i18n";
import { getCurrentUserWithRole, requireAuth } from "@/lib/auth";
import { redirect } from "@/lib/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { InviteForm } from "@/components/InviteForm";
import { InviteList, type InviteListItem } from "@/components/InviteList";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminInvitesPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;

  await requireAuth(locale);
  const current = await getCurrentUserWithRole();
  if (!current || current.role !== "admin") {
    redirect({ href: "/dashboard", locale });
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("invites")
    .select("id,email,used,expires_at,created_at")
    .order("created_at", { ascending: false });

  const invites = (data ?? []) as InviteListItem[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          Invites
        </h1>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Create invite</h2>
        <InviteForm
          buttonLabel="Create invite"
          emailLabel="Email"
          tokenLabel="Invite token"
          copiedLabel="Copied."
        />
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Invites</h2>
        <InviteList locale={locale} invites={invites} />
      </section>
    </div>
  );
}

