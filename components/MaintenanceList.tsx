import { getLocale, getTranslations } from "next-intl/server";

import { formatDateYmdUtc } from "@/lib/format";
import type { MaintenanceRecord } from "@/types";

type Props = {
  records: MaintenanceRecord[];
};

function iconSrc(n: number) {
  return `/maintenance-icons/divided-icons_${String(n).padStart(2, "0")}.png`;
}

function normalizeType(raw: string) {
  return raw.trim().toLowerCase();
}

export async function MaintenanceList({ records }: Props) {
  const t = await getTranslations("maintenance");
  const locale = await getLocale();

  function typeMeta(type: string): { label: string; icon: string | null } {
    const key = normalizeType(type);
    // Support older stored strings too.
    if (key === "oil" || key === "oil & filters" || key === "oil and filters") {
      return { label: t("type_oil"), icon: iconSrc(13) };
    }
    if (key === "filters" || key === "filter") {
      return { label: t("type_filters"), icon: iconSrc(14) };
    }
    if (key === "engine parts" || key === "engine components") {
      return { label: t("type_engine_parts"), icon: iconSrc(9) };
    }
    if (key === "brakes") {
      return { label: t("type_brakes"), icon: iconSrc(10) };
    }
    if (key === "tyres" || key === "tires" || key === "tires" || key === "tire") {
      return { label: t("type_tyres"), icon: iconSrc(15) };
    }
    if (key === "other") {
      return { label: t("type_other"), icon: iconSrc(4) };
    }
    return { label: type, icon: null };
  }

  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {records.map((row) => (
        <li key={row.id} className="px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {(() => {
              const meta = typeMeta(row.type);
              return (
                <p className="flex items-center gap-2 font-medium text-stone-900">
                  {meta.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={meta.icon}
                      alt=""
                      aria-hidden
                      className="h-12 w-12 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <span>{meta.label}</span>
                </p>
              );
            })()}
            <time
              dateTime={row.date}
              className="text-sm text-stone-600 tabular-nums"
            >
              {formatDateYmdUtc(row.date, locale)}
            </time>
          </div>
          <p className="mt-1 text-sm text-stone-600 tabular-nums">
            {t("odometer")}: {row.odometer.toLocaleString(locale)} km
          </p>
          {row.notes ? (
            <p className="mt-2 text-sm text-stone-700">{row.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
