"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { MAINTENANCE_TYPE_KEYS, type MaintenanceTypeKey } from "@/lib/type-keys";
import type { MaintenanceDueRow } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableScrollArea } from "@/components/ui/table-scroll";
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

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error === "validation" ? te("validation") : te("deleteFailed")}
        </p>
      ) : null}

      <TableScrollArea>
        <table className="min-w-max w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-3 py-2">{t("type")}</th>
              <th className="px-3 py-2">{t("intervalKm")}</th>
              <th className="px-3 py-2">{t("intervalDays")}</th>
              <th className="px-3 py-2">{t("dueSoonKm")}</th>
              <th className="px-3 py-2">{t("dueSoonDays")}</th>
              <th className="px-3 py-2">{t("status")}</th>
              <th className="px-3 py-2 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {MAINTENANCE_TYPE_KEYS.map((type) => {
              const d = defaultsByType.get(type);
              const o = overridesByType.get(type);
              const due = dueByType.get(type);

              const intervalKm = o?.interval_km ?? d?.interval_km ?? null;
              const intervalDays = o?.interval_days ?? d?.interval_days ?? null;
              const dueSoonKm = o?.due_soon_km ?? d?.due_soon_km ?? 1000;
              const dueSoonDays = o?.due_soon_days ?? d?.due_soon_days ?? 14;

              return (
                <tr key={type}>
                  <td className="px-3 py-2 font-medium text-stone-900">
                    {tMaint(typeLabelKey(type))}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      defaultValue={intervalKm ?? ""}
                      disabled={pending}
                      className="w-28 tabular-nums"
                      onChange={() => null}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      defaultValue={intervalDays ?? ""}
                      disabled={pending}
                      className="w-28 tabular-nums"
                      onChange={() => null}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      defaultValue={dueSoonKm}
                      disabled={pending}
                      className="w-28 tabular-nums"
                      onChange={() => null}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      defaultValue={dueSoonDays}
                      disabled={pending}
                      className="w-28 tabular-nums"
                      onChange={() => null}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {due ? (
                      <span
                        className={[
                          "inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
                          statusTone(due.status),
                        ].join(" ")}
                      >
                        {t(`status_${due.status}`)}
                      </span>
                    ) : (
                      <span className="text-sm text-stone-600">{t("status_unknown")}</span>
                    )}
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
                                type,
                                intervalKm,
                                intervalDays,
                                dueSoonKm: o?.due_soon_km ?? null,
                                dueSoonDays: o?.due_soon_days ?? null,
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
                        variant="destructive"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          startTransition(() => {
                            void (async () => {
                              const res = await deleteVehicleMaintenanceIntervalOverride({
                                locale,
                                vehicleId,
                                type,
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
      </TableScrollArea>
    </div>
  );
}

