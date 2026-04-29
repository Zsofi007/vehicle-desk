import { getCurrentUserWithRole, requireAuth } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n";
import { getTranslations } from "next-intl/server";
import { Car, LayoutDashboard, Settings, Shield } from "lucide-react";

import { AppSidebar, type AppNavItem } from "@/components/AppSidebar";
import { AddVehicleFab } from "@/components/AddVehicleFab";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoutForm } from "@/components/LogoutForm";
import { MobileDrawer } from "@/components/MobileDrawer";
import { TopNavTitle } from "@/components/TopNavTitle";

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
  await requireAuth(locale);
  const current = await getCurrentUserWithRole();

  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tAria = await getTranslations("aria");
  const tVeh = await getTranslations("vehicles");

  const items: AppNavItem[] = [
    { href: "/dashboard", label: tNav("dashboard"), icon: icon("dashboard") },
    { href: "/vehicles", label: tNav("vehicles"), icon: icon("vehicles") },
    { href: "/settings", label: tNav("settings"), icon: icon("settings") },
  ];
  if (current?.role === "admin") {
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
          subtitle="SaaS Platform"
          items={items}
        />
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <MobileDrawer buttonLabel={tAria("mainNavigation")}>
                <div className="flex h-full min-h-0 flex-col">
                  <AppSidebar
                    locale={locale}
                    title={tCommon("appName")}
                    subtitle="SaaS Platform"
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

            <div className="flex items-center gap-3">
              <LanguageSwitcher ariaLabel={tNav("language")} />
              <div className="hidden md:block">
                <LogoutForm locale={locale} label={tNav("logout")} />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-8 md:py-8">
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
