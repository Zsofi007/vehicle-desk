import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ExpirySection } from "@/components/expiry/ExpirySection";
import { MaintenanceSection } from "@/components/maintenance/MaintenanceSection";
import { VehicleDetailHeader } from "@/components/vehicles/VehicleDetailHeader";
import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { DEMO_REFERENCE_YMD } from "@/lib/demo/constants";
import {
  DEMO_VEHICLES,
  getDemoExpiryItemsForVehicle,
  getDemoMaintenanceForVehicle,
} from "@/lib/demo/fixtures";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function DemoVehicleDetailPage({ params }: Props) {
  const { locale: loc, id } = await params;
  const locale = loc as AppLocale;
  const t = await getTranslations("vehicles");
  const td = await getTranslations("vehicleDetail");
  const tMaint = await getTranslations("maintenance");
  const tExp = await getTranslations("expiry");

  const vehicle = DEMO_VEHICLES.find((v) => v.id === id);
  if (!vehicle) {
    notFound();
  }

  const maintenance = getDemoMaintenanceForVehicle(vehicle.id);
  const expiries = getDemoExpiryItemsForVehicle(vehicle.id);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/demo/vehicles"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 underline underline-offset-4 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {td("backToList")}
        </Link>
      </div>

      <VehicleDetailHeader
        locale={locale}
        vehicleId={vehicle.id}
        make={vehicle.make}
        model={vehicle.model}
        year={vehicle.year}
        odometer={vehicle.odometer}
        licensePlate={vehicle.license_plate}
        vehicleType={vehicle.vehicle_type}
        editLabel={t("edit")}
        deleteConfirmLabel={t("deleteConfirm")}
        deleteLabel={t("deleteVehicle")}
        readOnly
      />

      <MaintenanceSection
        title={td("maintenanceSection")}
        addLabel={tMaint("addRecord")}
        vehicleId={vehicle.id}
        locale={locale}
        records={maintenance}
        currentOdometer={vehicle.odometer}
        readOnly
      />

      <ExpirySection
        title={td("expirySection")}
        addLabel={tExp("addItem")}
        vehicleId={vehicle.id}
        locale={locale}
        vehicleYear={vehicle.year}
        items={expiries}
        readOnly
        statusReferenceYmd={DEMO_REFERENCE_YMD}
      />
    </div>
  );
}
