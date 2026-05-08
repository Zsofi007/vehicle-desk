"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { MAINTENANCE_TYPE_KEYS, type MaintenanceTypeKey } from "@/lib/type-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertOrgMaintenanceIntervalDefault } from "@/lib/actions/maintenance-intervals";

type DefaultRow = {
  type: MaintenanceTypeKey;
  interval_km: number | null;
  interval_days: number | null;
  due_soon_km: number;
  due_soon_days: number;
};

type Props = {
  locale: AppLocale;
  organizationId: string;
  canEdit: boolean;
  defaults: Array<{
    type: string;
    interval_km: number | null;
    interval_days: number | null;
    due_soon_km: number;
    due_soon_days: number;
  }>;
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

export function MaintenanceIntervalDefaultsEditor({
  locale,
  organizationId,
  canEdit,
  defaults,
}: Props) {
  const t = useTranslations("maintenanceIntervals");
  const tMaint = useTranslations("maintenance");
  const te = useTranslations("errors");

  const map = useMemo(() => {
    const m = new Map<string, DefaultRow>();
    for (const row of defaults) {
      if (!MAINTENANCE_TYPE_KEYS.includes(row.type as MaintenanceTypeKey)) continue;
      m.set(row.type, {
        type: row.type as MaintenanceTypeKey,
        interval_km: row.interval_km,
        interval_days: row.interval_days,
        due_soon_km: row.due_soon_km,
        due_soon_days: row.due_soon_days,
      });
    }
    return m;
  }, [defaults]);

  const [rows, setRows] = useState<DefaultRow[]>(
    MAINTENANCE_TYPE_KEYS.map((type) => {
      const existing = map.get(type);
      return (
        existing ?? {
          type,
          interval_km: null,
          interval_days: null,
          due_soon_km: 500,
          due_soon_days: 14,
        }
      );
    }),
  );

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error === "validation" ? te("validation") : te("deleteFailed")}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-3 py-2">{t("type")}</th>
              <th className="px-3 py-2">{t("intervalKm")}</th>
              <th className="px-3 py-2">{t("intervalDays")}</th>
              <th className="px-3 py-2">{t("dueSoonKm")}</th>
              <th className="px-3 py-2">{t("dueSoonDays")}</th>
              <th className="px-3 py-2 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((r, idx) => (
              <tr key={r.type}>
                <td className="px-3 py-2 font-medium text-stone-900">
                  {tMaint(typeLabelKey(r.type))}
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={r.interval_km ?? ""}
                    disabled={!canEdit || pending}
                    onChange={(e) => {
                      const next = e.currentTarget.value === "" ? null : Number(e.currentTarget.value);
                      setRows((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, interval_km: Number.isFinite(next) ? next : null } : p)),
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
                    disabled={!canEdit || pending}
                    onChange={(e) => {
                      const next = e.currentTarget.value === "" ? null : Number(e.currentTarget.value);
                      setRows((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, interval_days: Number.isFinite(next) ? next : null } : p)),
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
                    value={r.due_soon_km}
                    disabled={!canEdit || pending}
                    onChange={(e) => {
                      const next = Number(e.currentTarget.value);
                      setRows((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, due_soon_km: Number.isFinite(next) ? next : p.due_soon_km } : p)),
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
                    value={r.due_soon_days}
                    disabled={!canEdit || pending}
                    onChange={(e) => {
                      const next = Number(e.currentTarget.value);
                      setRows((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, due_soon_days: Number.isFinite(next) ? next : p.due_soon_days } : p)),
                      );
                    }}
                    className="w-28 tabular-nums"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!canEdit || pending}
                    onClick={() => {
                      setError(null);
                      startTransition(() => {
                        void (async () => {
                          const res = await upsertOrgMaintenanceIntervalDefault({
                            locale,
                            organizationId,
                            type: r.type,
                            intervalKm: r.interval_km,
                            intervalDays: r.interval_days,
                            dueSoonKm: r.due_soon_km,
                            dueSoonDays: r.due_soon_days,
                          });
                          if ("error" in res) setError(res.error ?? "error");
                        })();
                      });
                    }}
                  >
                    {t("save")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!canEdit ? (
        <p className="text-sm text-stone-600">{t("readOnlyHint")}</p>
      ) : null}
    </div>
  );
}

