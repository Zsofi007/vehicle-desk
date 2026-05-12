import {
  getCurrentUserWithRole,
  getOrganizationsForUser,
  getPreferredLocaleForUser,
  requireAuth,
  requireActiveOrganization,
} from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n";
import { getTranslations } from "next-intl/server";
import { Car, LayoutDashboard, Settings, Shield } from "lucide-react";
import { redirect } from "@/lib/navigation";

import { AppSidebar, type AppNavItem } from "@/components/shell/AppSidebar";
import { AddVehicleFab } from "@/components/vehicles/AddVehicleFab";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { LogoutForm } from "@/components/shell/LogoutForm";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { OrganizationSwitcher } from "@/components/shell/OrganizationSwitcher";
import { TopNavTitle } from "@/components/shell/TopNavTitle";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function icon(kind: "dashboard" | "vehicles" | "admin" | "settings") {
  const cls = "h-5 w-5";
  if (kind === "dashboard") return <LayoutDashboard className={cls} aria-hidden />;
  if (kind === "vehicles") return <Car className={cls} aria-hidden />;
  if (kind === "settings") return <Settings className={cls} aria-hidden />;
  return <Shield className={cls} aria-hidden />;
}

export default async function AppSectionLayout({ children, params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const user = await requireAuth(locale);
  const preferred = await getPreferredLocaleForUser(user.id);
  if (preferred && preferred !== locale) {
    // Ensure the UI locale matches the user's preference (e.g. default 'ro' for new users).
    redirect({ href: "/dashboard", locale: preferred });
  }
  const current = await getCurrentUserWithRole();
  const isGlobalAdmin = current?.role === "admin";

  // Global admins are control-plane only: no org membership, no vehicles/dashboard.
  if (isGlobalAdmin) {
    const tNav = await getTranslations("nav");
    const tCommon = await getTranslations("common");
    const tAria = await getTranslations("aria");

    const items: AppNavItem[] = [
      { href: "/admin/invites", label: tNav("admin"), icon: icon("admin") },
    ];

    return (
      <div className="min-h-screen bg-[#fbf8fa] text-slate-900">
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white md:block">
          <AppSidebar
            locale={locale}
            title={tCommon("appName")}
            subtitle={tNav("admin")}
            items={items}
          />
        </aside>

        <div className="min-w-0 md:pl-64">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
            <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:gap-4 md:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                <MobileDrawer buttonLabel={tAria("mainNavigation")}>
                  <div className="flex h-full min-h-0 flex-col">
                    <AppSidebar
                      locale={locale}
                      title={tCommon("appName")}
                      subtitle={tNav("admin")}
                      items={items}
                    />
                    <div className="border-t border-slate-200 p-4">
                      <LogoutForm locale={locale} label={tNav("logout")} />
                    </div>
                  </div>
                </MobileDrawer>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-slate-900">
                    <TopNavTitle fallback={tCommon("appName")} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <LanguageSwitcher ariaLabel={tNav("language")} persistPreference={false} />
                <div className="hidden md:block">
                  <LogoutForm locale={locale} label={tNav("logout")} />
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto min-w-0 w-full max-w-[1280px] px-4 py-4 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  const { organization } = await requireActiveOrganization(locale);
  const orgs = await getOrganizationsForUser(user.id);

  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tAria = await getTranslations("aria");
  const tVeh = await getTranslations("vehicles");
  const companySubtitle = String(organization.name ?? "").trim();

  const items: AppNavItem[] = [
    { href: "/dashboard", label: tNav("dashboard"), icon: icon("dashboard") },
    { href: "/vehicles", label: tNav("vehicles"), icon: icon("vehicles") },
    { href: "/settings", label: tNav("settings"), icon: icon("settings") },
  ];
  const isOrgAdmin = organization.role === "owner" || organization.role === "admin";
  if (isOrgAdmin) {
    items.push({
      href: "/admin/invites",
      label: tNav("admin"),
      icon: icon("admin"),
    });
  }

  return (
    <div className="min-h-screen bg-[#fbf8fa] text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white md:block">
        <AppSidebar
          locale={locale}
          title={tCommon("appName")}
          subtitle={companySubtitle || tCommon("appName")}
          items={items}
        />
      </aside>

      <div className="min-w-0 md:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:gap-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
              <MobileDrawer buttonLabel={tAria("mainNavigation")}>
                <div className="flex h-full min-h-0 flex-col">
                  <AppSidebar
                    locale={locale}
                    title={tCommon("appName")}
                    subtitle={companySubtitle || tCommon("appName")}
                    items={items}
                  />
                  <div className="border-t border-slate-200 p-4">
                    <LogoutForm locale={locale} label={tNav("logout")} />
                  </div>
                </div>
              </MobileDrawer>
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-900">
                  <TopNavTitle fallback={tCommon("appName")} />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-2 md:gap-3">
              <OrganizationSwitcher
                ariaLabel={tAria("organizationSwitcher")}
                activeOrganizationId={organization.id}
                organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
              />
              <LanguageSwitcher ariaLabel={tNav("language")} />
              <div className="hidden md:block">
                <LogoutForm locale={locale} label={tNav("logout")} />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto min-w-0 w-full max-w-[1280px] px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-8">
          {children}
        </main>

        <AddVehicleFab
          locale={locale}
          label={tVeh("addVehicle")}
          title={tVeh("addVehicle")}
          description={tVeh("subtitle")}
        />
      </div>
    </div>
  );
}
