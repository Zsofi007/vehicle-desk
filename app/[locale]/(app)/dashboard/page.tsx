import { getTranslations, getLocale } from "next-intl/server";
import { Clock, Info, Wrench } from "lucide-react";

import { getCurrentUserWithRole, requireActiveOrganization } from "@/lib/auth";
import { formatDateYmdUtc } from "@/lib/format";
import type { AppLocale } from "@/lib/i18n";
import { Link, redirect } from "@/lib/navigation";
import { TableScrollArea } from "@/components/ui/table-scroll";
import { VehicleMakeLogo } from "@/components/vehicles/VehicleMakeLogo";
import {
  getAlertsForOrg,
  getMaintenanceDueForOrg,
  getUpcomingExpiriesForOrg,
  getVehiclesForOrg,
} from "@/lib/queries";

type Props = {
  params: Promise<{ locale: string }>;
};

function statCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </div>
      {hint ? <div className="mt-2 text-sm text-slate-600">{hint}</div> : null}
    </div>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const current = await getCurrentUserWithRole();
  if (current?.role === "admin") {
    redirect({ href: "/admin/invites", locale });
  }
  const { organization } = await requireActiveOrganization(locale);
  const t = await getTranslations("dashboard");
  const tMaint = await getTranslations("maintenance");
  const tExp = await getTranslations("expiry");
  const tStatus = await getTranslations("status");
  const tIntervals = await getTranslations("maintenanceIntervals");
  const localeTag = await getLocale();

  const vehicles = await getVehiclesForOrg(organization.id);
  const upcoming = await getUpcomingExpiriesForOrg(organization.id);
  const alerts = await getAlertsForOrg(organization.id);
  const dueMaint = await getMaintenanceDueForOrg(organization.id);
  const maintOverdue = dueMaint.filter((r) => r.status === "overdue");
  const maintSoon = dueMaint.filter((r) => r.status === "due_soon");
  const expired = alerts.filter((a) => a.kind === "expired");
  const soon = alerts.filter((a) => a.kind === "expiry_soon");
  const expiryAlertCount = expired.length + soon.length;
  const maintAlertCount = maintOverdue.length + maintSoon.length;
  const totalDashboardAlerts = expiryAlertCount + maintAlertCount;

  const staleBefore = new Date();
  staleBefore.setUTCDate(staleBefore.getUTCDate() - 90);
  const staleVehicles = vehicles.filter((v) => {
    const ts = v.last_odometer_update_at;
    if (!ts) return false;
    return new Date(ts).getTime() < staleBefore.getTime();
  });

  function translateEnum(
    prefix: string,
    raw: string,
    tr: (key: string) => string,
  ) {
    const key = `${prefix}_${raw.toLowerCase()}`;
    try {
      return tr(key);
    } catch {
      return raw;
    }
  }

  return (
    <div className="space-y-8">
      <div className="hidden flex-wrap items-end justify-between gap-4 md:flex">
        <div>
          <p className="mt-2 text-base text-slate-600">{t("subtitle")}</p>
        </div>
      </div>

      <section aria-label="Overview">
        <div className="grid gap-4 md:grid-cols-3">
          {statCard({
            label: t("totalVehicles"),
            value: vehicles.length,
          })}
          {statCard({
            label: t("alerts"),
            value: totalDashboardAlerts,
            hint:
              totalDashboardAlerts === 0 ? (
                t("emptyAlerts")
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  {expiryAlertCount > 0 ? (
                    <div className="flex items-start gap-2">
                      <Clock
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-red-700">
                          <span className="tabular-nums">{expired.length}</span>{" "}
                          {tStatus("expired")}
                        </span>
                        <span className="text-slate-400" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                        <span className="font-medium text-yellow-600">
                          <span className="tabular-nums">{soon.length}</span>{" "}
                          {tStatus("expiringSoon")}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  {maintAlertCount > 0 ? (
                    <div className="flex items-start gap-2">
                      <Wrench
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-red-700">
                          <span className="tabular-nums">{maintOverdue.length}</span>{" "}
                          {tIntervals("status_overdue")}
                        </span>
                        <span className="text-slate-400" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                        <span className="font-medium text-yellow-600">
                          <span className="tabular-nums">{maintSoon.length}</span>{" "}
                          {tIntervals("status_due_soon")}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              ),
          })}
          {statCard({
            label: t("upcomingExpiries"),
            value: upcoming.length,
            hint: upcoming.length > 0 ? t("upcomingExpiries") : t("emptyUpcoming"),
          })}
        </div>
      </section>

      {staleVehicles.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Info className="h-6 w-6 text-blue-600" aria-hidden />
            <span>{t("odometerUpdateRecommendedTitle")}</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t("odometerUpdateRecommendedSummary", { count: staleVehicles.length })}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer select-none text-sm font-medium text-slate-700 hover:text-slate-900">
              {t("odometerUpdateRecommendedToggle")}
            </summary>
            <div className="mt-3 grid gap-2">
              {staleVehicles.slice(0, 10).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <VehicleMakeLogo make={v.make} className="h-12 w-12 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-600">
                      {v.make} {v.model}
                      <span className="text-slate-400"> · </span>
                      <span className="tabular-nums">{v.year}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {t("odometerLastUpdateLabel")}{" "}
                      {formatDateYmdUtc(
                        String(v.last_odometer_update_at ?? "").slice(0, 10),
                        localeTag,
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/vehicles/${v.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/car-key-2.png"
                      alt=""
                      aria-hidden
                      className="h-5 w-5"
                      loading="lazy"
                      decoding="async"
                    />
                    {t("openVehicle")}
                  </Link>
                </div>
              ))}
              {staleVehicles.length > 10 ? (
                <p className="text-xs text-slate-500">
                  {t("odometerUpdateRecommendedShowing", {
                    shown: 10,
                    total: staleVehicles.length,
                  })}
                </p>
              ) : null}
            </div>
          </details>
        </section>
      ) : null}

      <section aria-labelledby="maintenance-due-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="maintenance-due-heading"
            className="text-base font-semibold text-slate-900"
          >
            {tIntervals("vehicleTitle")}
          </h2>
          <div className="text-sm font-medium text-slate-700">
            {maintOverdue.length + maintSoon.length > 0 ? (
              <span>
                <span className="font-medium text-red-700">
                  <span className="tabular-nums">{maintOverdue.length}</span>{" "}
                  {tIntervals("status_overdue")}
                </span>
                <span className="text-slate-400" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <span className="font-medium text-yellow-600">
                  <span className="tabular-nums">{maintSoon.length}</span>{" "}
                  {tIntervals("status_due_soon")}
                </span>
              </span>
            ) : (
              <span className="text-slate-600">{tIntervals("status_ok")}</span>
            )}
          </div>
        </div>

        {maintOverdue.length + maintSoon.length === 0 ? null : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <TableScrollArea>
              <table className="min-w-max w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Wrench className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                      {tIntervals("type")}
                    </span>
                  </th>
                  <th className="px-4 py-3">{t("vehicleLabel")}</th>
                  <th className="px-4 py-3">{t("maintenanceReason")}</th>
                  <th className="px-4 py-3">{tIntervals("status")}</th>
                  <th className="px-4 py-3 text-right">{t("openVehicle")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueMaint
                  .filter((r) => r.status === "overdue" || r.status === "due_soon")
                  .slice(0, 6)
                  .map((row) => {
                    const statusLabel =
                      row.status === "overdue"
                        ? tIntervals("status_overdue")
                        : tIntervals("status_due_soon");
                    const statusStyle =
                      row.status === "overdue"
                        ? "border-red-200 bg-red-50 text-red-900"
                        : "border-amber-200 bg-amber-50 text-amber-900";
                    const reason =
                      row.reason === "km"
                        ? t("maintenanceReasonKm")
                        : row.reason === "time"
                          ? t("maintenanceReasonTime")
                          : t("maintenanceReasonUnknown");

                    const vehicle = vehicles.find((v) => v.id === row.vehicle_id);
                    const vehicleLabel = vehicle
                      ? `${vehicle.make} ${vehicle.model} · ${vehicle.license_plate}`
                      : row.vehicle_id;

                    return (
                      <tr key={`${row.vehicle_id}:${row.type}`} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {translateEnum("type", String(row.type), tMaint)}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <div className="flex items-center gap-3">
                            {vehicle ? (
                              <VehicleMakeLogo
                                make={vehicle.make}
                                className="h-10 w-10 object-contain"
                              />
                            ) : null}
                            <span className="min-w-0 truncate">{vehicleLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{reason}</td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
                              statusStyle,
                            ].join(" ")}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/vehicles/${row.vehicle_id}`}
                            className="inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/car-key-2.png"
                              alt=""
                              aria-hidden
                              className="h-5 w-5"
                              loading="lazy"
                              decoding="async"
                            />
                            {t("openVehicle")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </TableScrollArea>
          </div>
        )}
      </section>

      <section aria-labelledby="alerts-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="alerts-heading" className="text-base font-semibold text-slate-900">
            {t("alerts")}
          </h2>
          <div className="text-sm font-medium text-slate-700">
            {alerts.length === 0 ? (
              <span className="text-slate-600">{tStatus("ok")}</span>
            ) : (
              <span>
                <span className="font-medium text-red-700">
                  <span className="tabular-nums">{expired.length}</span>{" "}
                  {tStatus("expired")}
                </span>
                <span className="text-slate-400" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <span className="font-medium text-yellow-600">
                  <span className="tabular-nums">{soon.length}</span>{" "}
                  {tStatus("expiringSoon")}
                </span>
              </span>
            )}
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">
            {t("emptyAlerts")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <TableScrollArea>
              <table className="min-w-max w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                      {tExp("type")}
                    </span>
                  </th>
                  <th className="px-4 py-3">{t("vehicleLabel")}</th>
                  <th className="px-4 py-3">{tExp("expiryDate")}</th>
                  <th className="px-4 py-3">{tStatus("state")}</th>
                  <th className="px-4 py-3 text-right">{t("openVehicle")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.slice(0, 6).map(({ expiry, vehicle, kind }) => {
                  const statusLabel =
                    kind === "expired"
                      ? tStatus("badgeExpired")
                      : tStatus("badgeSoon");
                  const statusStyle =
                    kind === "expired"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-amber-200 bg-amber-50 text-amber-900";

                  return (
                    <tr key={expiry.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {translateEnum("type", String(expiry.type), tExp)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <div className="flex items-center gap-3">
                          <VehicleMakeLogo
                            make={vehicle.make}
                            className="h-10 w-10 object-contain"
                          />
                          <span className="min-w-0 truncate">
                            {vehicle.make} {vehicle.model} · {vehicle.license_plate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 tabular-nums text-slate-700">
                        {formatDateYmdUtc(expiry.expiry_date, localeTag)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
                            statusStyle,
                          ].join(" ")}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/car-key-2.png"
                            alt=""
                            aria-hidden
                            className="h-5 w-5"
                            loading="lazy"
                            decoding="async"
                          />
                          {t("openVehicle")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </TableScrollArea>
          </div>
        )}
      </section>
    </div>
  );
}
