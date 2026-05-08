"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { MAINTENANCE_TYPE_KEYS, type MaintenanceTypeKey } from "@/lib/type-keys";
import type { MaintenanceDueRow } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteVehicleMaintenanceIntervalOverride,
  upsertVehicleMaintenanceIntervalOverride,
} from "@/lib/actions/maintenance-intervals";

type DefaultRow = {
  type: MaintenanceTypeKey;
  interval_km: number | null;
  interval_days: number | null;
  due_soon_km: number;
  due_soon_days: number;
};

type OverrideRow = {
  type: MaintenanceTypeKey;
  interval_km: number | null;
  interval_days: number | null;
  due_soon_km: number | null;
  due_soon_days: number | null;
};

type Props = {
  locale: AppLocale;
  vehicleId: string;
  defaults: Array<{
    type: string;
    interval_km: number | null;
    interval_days: number | null;
    due_soon_km: number;
    due_soon_days: number;
  }>;
  overrides: Array<{
    type: string;
    interval_km: number | null;
    interval_days: number | null;
    due_soon_km: number | null;
    due_soon_days: number | null;
  }>;
  dueRows: MaintenanceDueRow[];
};

function typeLabelKey(type: MaintenanceTypeKey) {
  switch (type) {
    case "OIL_CHANGE":
      return "type_oil_change";
    case "FILTERS":
      return "type_filters";
    case "BRAKES":
      return "type_brakes";
    case "TIRES":
      return "type_tires";
    case "BATTERY":
      return "type_battery";
    case "TIMING_BELT":
      return "type_timing_belt";
    case "OTHER":
      return "type_other";
  }
}

function statusTone(status: MaintenanceDueRow["status"]) {
  if (status === "overdue") return "border-red-200 bg-red-50 text-red-900";
  if (status === "due_soon") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "no_history") return "border-stone-200 bg-stone-50 text-stone-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export function MaintenanceIntervalOverridesPanel({
  locale,
  vehicleId,
  defaults,
  overrides,
  dueRows,
}: Props) {
  const t = useTranslations("maintenanceIntervals");
  const tMaint = useTranslations("maintenance");
  const te = useTranslations("errors");

  const defaultsByType = useMemo(() => {
    const m = new Map<MaintenanceTypeKey, DefaultRow>();
    for (const row of defaults) {
      if (!MAINTENANCE_TYPE_KEYS.includes(row.type as MaintenanceTypeKey)) continue;
      m.set(row.type as MaintenanceTypeKey, {
        type: row.type as MaintenanceTypeKey,
        interval_km: row.interval_km,
        interval_days: row.interval_days,
        due_soon_km: row.due_soon_km,
        due_soon_days: row.due_soon_days,
      });
    }
    return m;
  }, [defaults]);

  const overridesByType = useMemo(() => {
    const m = new Map<MaintenanceTypeKey, OverrideRow>();
    for (const row of overrides) {
      if (!MAINTENANCE_TYPE_KEYS.includes(row.type as MaintenanceTypeKey)) continue;
      m.set(row.type as MaintenanceTypeKey, {
        type: row.type as MaintenanceTypeKey,
        interval_km: row.interval_km,
        interval_days: row.interval_days,
        due_soon_km: row.due_soon_km,
        due_soon_days: row.due_soon_days,
      });
    }
    return m;
  }, [overrides]);

  const dueByType = useMemo(() => {
    const m = new Map<MaintenanceTypeKey, MaintenanceDueRow>();
    for (const row of dueRows) {
      if (!MAINTENANCE_TYPE_KEYS.includes(row.type as MaintenanceTypeKey)) continue;
      m.set(row.type as MaintenanceTypeKey, row);
    }
    return m;
  }, [dueRows]);

  const [form, setForm] = useState(() =>
    MAINTENANCE_TYPE_KEYS.map((type) => {
      const o = overridesByType.get(type);
      const d = defaultsByType.get(type);
      return {
        type,
        interval_km: o?.interval_km ?? null,
        interval_days: o?.interval_days ?? null,
        due_soon_km: o?.due_soon_km ?? null,
        due_soon_days: o?.due_soon_days ?? null,
        effective: {
          interval_km: o?.interval_km ?? d?.interval_km ?? null,
          interval_days: o?.interval_days ?? d?.interval_days ?? null,
          due_soon_km: o?.due_soon_km ?? d?.due_soon_km ?? 500,
          due_soon_days: o?.due_soon_days ?? d?.due_soon_days ?? 14,
        },
        hasOverride: Boolean(o),
      };
    }),
  );

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-900">{t("vehicleTitle")}</h3>
        <p className="text-sm text-stone-600">{t("vehicleHint")}</p>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error === "validation" ? te("validation") : te("deleteFailed")}
        </p>
      ) : null}

      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-3 py-2">{t("type")}</th>
              <th className="px-3 py-2">{t("status")}</th>
              <th className="px-3 py-2">{t("intervalKm")}</th>
              <th className="px-3 py-2">{t("intervalDays")}</th>
              <th className="px-3 py-2 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {form.map((r, idx) => {
              const due = dueByType.get(r.type);
              const status = due?.status ?? "ok";
              const configured = r.effective.interval_km !== null || r.effective.interval_days !== null;
              const statusLabel = configured ? t(`status_${status}`) : t("status_not_configured");
              return (
                <tr key={r.type}>
                  <td className="px-3 py-2 font-medium text-stone-900">
                    {tMaint(typeLabelKey(r.type))}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
                        configured ? statusTone(status as any) : "border-stone-200 bg-stone-50 text-stone-700",
                      ].join(" ")}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={r.interval_km ?? ""}
                      disabled={pending}
                      onChange={(e) => {
                        const next = e.currentTarget.value === "" ? null : Number(e.currentTarget.value);
                        setForm((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, interval_km: Number.isFinite(next) ? next : null } : p,
                          ),
                        );
                      }}
                      className="w-28 tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={r.interval_days ?? ""}
                      disabled={pending}
                      onChange={(e) => {
                        const next = e.currentTarget.value === "" ? null : Number(e.currentTarget.value);
                        setForm((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, interval_days: Number.isFinite(next) ? next : null } : p,
                          ),
                        );
                      }}
                      className="w-28 tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          startTransition(() => {
                            void (async () => {
                              const res = await upsertVehicleMaintenanceIntervalOverride({
                                locale,
                                vehicleId,
                                type: r.type,
                                intervalKm: r.interval_km,
                                intervalDays: r.interval_days,
                                dueSoonKm: null,
                                dueSoonDays: null,
                              });
                              if ("error" in res) setError(res.error ?? "error");
                            })();
                          });
                        }}
                      >
                        {t("save")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!r.hasOverride || pending}
                        onClick={() => {
                          setError(null);
                          startTransition(() => {
                            void (async () => {
                              const res = await deleteVehicleMaintenanceIntervalOverride({
                                locale,
                                vehicleId,
                                type: r.type,
                              });
                              if ("error" in res) setError(res.error ?? "error");
                            })();
                          });
                        }}
                      >
                        {t("clear")}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

