"use client";

import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { demoNoteMessageKey, isDemoNoteKey } from "@/lib/demo/note-keys";
import type { MaintenanceRecord } from "@/types";
import { formatDateYmdUtc } from "@/lib/format";

type Props = {
  locale: AppLocale;
  records: MaintenanceRecord[];
};

function iconSrc(n: number) {
  return `/maintenance-icons/divided-icons_${String(n).padStart(2, "0")}.png`;
}

function typeMeta(
  t: ReturnType<typeof useTranslations>,
  type: string,
): { label: string; icon: string | null } {
  switch (type) {
    case "OIL_CHANGE":
      return { label: t("type_oil_change"), icon: iconSrc(13) };
    case "FILTERS":
      return { label: t("type_filters"), icon: iconSrc(14) };
    case "BRAKES":
      return { label: t("type_brakes"), icon: iconSrc(10) };
    case "TIRES":
      return { label: t("type_tires"), icon: iconSrc(15) };
    case "BATTERY":
      return { label: t("type_battery"), icon: iconSrc(4) };
    case "TIMING_BELT":
      return { label: t("type_timing_belt"), icon: iconSrc(9) };
    case "OTHER":
      return { label: t("type_other"), icon: iconSrc(4) };
    default:
      return { label: type, icon: iconSrc(4) };
  }
}

export function ReadOnlyMaintenanceList({ locale, records }: Props) {
  const t = useTranslations("maintenance");
  const tDemo = useTranslations("demo");

  if (records.length === 0) {
    return <p className="text-sm text-stone-600">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
      {records.map((row) => {
        const meta = typeMeta(t, row.type);
        return (
          <li key={row.id} className="px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="flex items-center gap-2 font-medium text-stone-900">
                {meta.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.icon}
                    alt=""
                    aria-hidden
                    className="h-10 w-10 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <span>{meta.label}</span>
              </p>
              <time dateTime={row.date} className="text-sm text-stone-600 tabular-nums">
                {formatDateYmdUtc(row.date, locale)}
              </time>
            </div>
            <p className="mt-1 text-sm text-stone-600 tabular-nums">
              {t("odometer")}: {row.odometer.toLocaleString(locale)} km
            </p>
            {row.notes ? (
              <p className="mt-2 text-sm text-stone-700">
                {isDemoNoteKey(row.notes) ? tDemo(demoNoteMessageKey(row.notes)) : row.notes}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
