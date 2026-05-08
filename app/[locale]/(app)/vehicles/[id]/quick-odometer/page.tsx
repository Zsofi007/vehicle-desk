import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/lib/i18n";
import { getCurrentUserWithRole, requireActiveOrganization, requireAuth } from "@/lib/auth";
import { redirect } from "@/lib/navigation";
import { getVehicleForOrg } from "@/lib/queries";
import { QuickOdometerForm } from "@/components/QuickOdometerForm";
import { VehicleMakeLogo } from "@/components/VehicleMakeLogo";
import { LicensePlate } from "@/components/LicensePlate";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function QuickOdometerPage({ params }: Props) {
  const { locale: loc, id } = await params;
  const locale = loc as AppLocale;

  const current = await getCurrentUserWithRole();
  if (current?.role === "admin") {
    redirect({ href: "/admin/invites", locale });
  }

  await requireAuth(locale);
  const { organization } = await requireActiveOrganization(locale);

  const vehicle = await getVehicleForOrg(organization.id, id);
  if (!vehicle) notFound();

  const t = await getTranslations("vehicles");
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-4 text-sm font-medium text-stone-700">{t("title")}</p>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <VehicleMakeLogo make={vehicle.make} className="h-16 w-16 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-slate-600">
            {vehicle.make} {vehicle.model}
            <span className="text-slate-400"> · </span>
            <span className="tabular-nums">{vehicle.year}</span>
          </div>
          <div className="mt-2 min-w-0">
            <LicensePlate value={vehicle.license_plate} size="md" strip="narrow" />
          </div>
        </div>
      </div>

      <QuickOdometerForm
        locale={locale}
        vehicleId={vehicle.id}
        initialOdometer={vehicle.odometer}
      />
    </div>
  );
}

