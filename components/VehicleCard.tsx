import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import type { Vehicle } from "@/types";

import { DeleteVehicleButton } from "./DeleteVehicleButton";

type Props = {
  vehicle: Vehicle;
  locale: AppLocale;
};

export async function VehicleCard({ vehicle, locale }: Props) {
  const t = await getTranslations("vehicles");
  const odometer = vehicle.odometer.toLocaleString(locale);

  return (
    <article className="flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            {vehicle.make} {vehicle.model}
          </h2>
          <dl className="mt-3 grid gap-2 text-sm text-stone-600">
            <div className="flex gap-2">
              <dt className="font-medium text-stone-700">{t("year")}</dt>
              <dd>{vehicle.year}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-stone-700">{t("plate")}</dt>
              <dd>{vehicle.license_plate}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-stone-700">{t("odometer")}</dt>
              <dd>
                {odometer} km
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            {t("view")}
          </Link>
          <DeleteVehicleButton
            vehicleId={vehicle.id}
            locale={locale}
            confirmLabel={t("deleteConfirm")}
            deleteLabel={t("deleteVehicle")}
          />
        </div>
      </div>
    </article>
  );
}
