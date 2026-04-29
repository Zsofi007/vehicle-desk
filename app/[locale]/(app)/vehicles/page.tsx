import { getTranslations } from "next-intl/server";

import { requireAuth } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n";
import { getAlertsForUser, getVehiclesForUser } from "@/lib/queries";
import { VehiclesBrowser, type VehicleTileRow } from "@/components/VehiclesBrowser";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VehiclesPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const user = await requireAuth(locale);
  const t = await getTranslations("vehicles");
  const tNav = await getTranslations("nav");
  const tStatus = await getTranslations("status");

  const vehicles = await getVehiclesForUser(user.id);
  const alerts = await getAlertsForUser(user.id);

  const vehicleStatus = new Map<string, "expired" | "soon" | "ok">();
  for (const a of alerts) {
    const current = vehicleStatus.get(a.vehicle.id);
    if (current === "expired") continue;
    if (a.kind === "expired") vehicleStatus.set(a.vehicle.id, "expired");
    else if (a.kind === "expiry_soon") vehicleStatus.set(a.vehicle.id, "soon");
    else if (!current) vehicleStatus.set(a.vehicle.id, "ok");
  }

  const rows: VehicleTileRow[] = vehicles.map((v) => {
    const status = vehicleStatus.get(v.id) ?? "ok";
    const badge =
      status === "expired"
        ? {
            text: tStatus("badgeExpired"),
            cls: "border-red-200 bg-red-50 text-red-900",
          }
        : status === "soon"
          ? {
              text: tStatus("badgeSoon"),
              cls: "border-amber-200 bg-amber-50 text-amber-900",
            }
          : {
              text: tStatus("badgeOk"),
              cls: "border-emerald-200 bg-emerald-50 text-emerald-900",
            };

    return {
      vehicle: v,
      status,
      statusLabel: badge.text,
      statusClassName: badge.cls,
    };
  });

  return (
    <div className="space-y-8">
      <div className="hidden flex-wrap items-end justify-between gap-4 md:flex">
        <div>
          <p className="mt-2 text-base text-slate-600">{t("subtitle")}</p>
        </div>
      </div>

      <section aria-label="Overview">
        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:overflow-visible md:px-0">
          <div className="grid grid-flow-col auto-cols-[7rem] gap-3 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:gap-4">
            <div className="aspect-square rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:aspect-auto md:p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("totalVehicles")}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900 md:text-2xl">
                {vehicles.length}
              </div>
              <div className="mt-2 text-xs text-slate-600 md:text-sm">{tNav("vehicles")}</div>
            </div>

            <div className="aspect-square rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:aspect-auto md:p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {tStatus("expiringSoon")}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900 md:text-2xl">
                {alerts.filter((a) => a.kind === "expiry_soon").length}
              </div>
              <div className="mt-2 text-xs text-slate-600 md:text-sm">{tStatus("badgeSoon")}</div>
            </div>

            <div className="aspect-square rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:aspect-auto md:p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {tStatus("expired")}
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-red-700 md:text-2xl">
                {alerts.filter((a) => a.kind === "expired").length}
              </div>
              <div className="mt-2 text-xs text-slate-600 md:text-sm">
                {tStatus("badgeExpired")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-sm text-slate-600">
          {t("empty")}
        </div>
      ) : (
        <VehiclesBrowser
          locale={locale}
          rows={rows}
          searchLabel={t("searchLabel")}
          searchPlaceholder={t("searchPlaceholder")}
          filterLabel={t("filterStatus")}
          filterAll={t("filterAll")}
          filterOk={tStatus("badgeOk")}
          filterSoon={tStatus("badgeSoon")}
          filterExpired={tStatus("badgeExpired")}
          sortLabel={t("sortBy")}
          sortPlate={t("sortPlate")}
          sortMake={t("sortMake")}
          sortYear={t("sortYear")}
          sortStatus={t("sortStatus")}
          addVehicleLabel={t("addVehicle")}
          addVehicleDescription={t("subtitle")}
        />
      )}

    </div>
  );
}
