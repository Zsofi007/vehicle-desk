import { getTranslations, getLocale } from "next-intl/server";

import { requireAuth } from "@/lib/auth";
import { formatDateYmdUtc } from "@/lib/format";
import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { VehicleMakeLogo } from "@/components/VehicleMakeLogo";
import {
  getAlertsForUser,
  getUpcomingExpiriesForUser,
  getVehiclesForUser,
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
  const user = await requireAuth(locale);
  const t = await getTranslations("dashboard");
  const tExp = await getTranslations("expiry");
  const tStatus = await getTranslations("status");
  const localeTag = await getLocale();

  const vehicles = await getVehiclesForUser(user.id);
  const upcoming = await getUpcomingExpiriesForUser(user.id);
  const alerts = await getAlertsForUser(user.id);
  const expired = alerts.filter((a) => a.kind === "expired");
  const soon = alerts.filter((a) => a.kind === "expiry_soon");

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
            value: expired.length + soon.length,
            hint:
              expired.length + soon.length > 0 ? (
                <span className="text-red-700">
                  {expired.length} {tStatus("expired")} · {soon.length}{" "}
                  {tStatus("expiringSoon")}
                </span>
              ) : (
                t("emptyAlerts")
              ),
          })}
          {statCard({
            label: t("upcomingExpiries"),
            value: upcoming.length,
            hint: upcoming.length > 0 ? t("upcomingExpiries") : t("emptyUpcoming"),
          })}
        </div>
      </section>

      <section aria-labelledby="alerts-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="alerts-heading" className="text-base font-semibold text-slate-900">
            {t("alerts")}
          </h2>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">
            {t("emptyAlerts")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">{tExp("type")}</th>
                  <th className="px-4 py-3">{t("vehicleLabel")}</th>
                  <th className="px-4 py-3">{tExp("expiryDate")}</th>
                  <th className="px-4 py-3">{tStatus("ok")}</th>
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
                        {expiry.type}
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
          </div>
        )}
      </section>
    </div>
  );
}
