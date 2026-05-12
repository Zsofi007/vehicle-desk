"use client";

import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { DEMO_EXPIRY_NOTE_KEYS } from "@/lib/demo/note-keys";
import { addUtcDays, formatUtcDateString, getExpiryStatus, utcTodayString } from "@/lib/dates";
import type { ExpiryItem } from "@/types";
import { formatDateYmdUtc } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  locale: AppLocale;
  items: ExpiryItem[];
  /** When set (e.g. marketing demo), expiry badges use this date as “today”. */
  statusReferenceYmd?: string;
};

function expiryTypeMeta(
  t: ReturnType<typeof useTranslations>,
  type: string,
): { label: string; iconSrc?: string } {
  const key = type.trim().toLowerCase();
  if (key === "itp") return { label: t("type_itp"), iconSrc: "/service-icons/better-icons_24.png" };
  if (key === "rca") return { label: t("type_rca"), iconSrc: "/service-icons/better-icons_19.png" };
  if (key === "casco") return { label: t("type_casco"), iconSrc: "/service-icons/better-icons_25.png" };
  if (key === "vignette" || key === "vignetă" || key === "vigneta")
    return { label: t("type_vignette"), iconSrc: "/service-icons/better-icons_11.png" };
  if (key === "rovinietă" || key === "rovinieta")
    return { label: t("type_rovinieta"), iconSrc: "/service-icons/rovinieta.png" };
  if (key === "other") return { label: t("type_other"), iconSrc: "/service-icons/better-icons_12.png" };
  return { label: type, iconSrc: "/service-icons/better-icons_12.png" };
}

export function ReadOnlyExpiryList({ locale, items, statusReferenceYmd }: Props) {
  const t = useTranslations("expiry");
  const tDemo = useTranslations("demo");
  const tStatus = useTranslations("status");
  const tAria = useTranslations("aria");

  const today = statusReferenceYmd ?? utcTodayString();
  const soonEnd = formatUtcDateString(addUtcDays(new Date(`${today}T12:00:00.000Z`), 7));

  const active = items.filter((row) => row.is_active !== false);

  if (active.length === 0) {
    return <p className="text-sm text-stone-600">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
      {active.map((row) => {
        const demoExpiryNoteKey = DEMO_EXPIRY_NOTE_KEYS[row.id];
        const meta = expiryTypeMeta(t, row.type);
        const status = getExpiryStatus(row.expiry_date, today, soonEnd);
        const statusLabel =
          status === "expired"
            ? tStatus("badgeExpired")
            : status === "expiring_soon"
              ? tStatus("badgeSoon")
              : tStatus("badgeOk");
        const statusTone =
          status === "expired"
            ? "border-red-200 bg-red-50 text-red-900"
            : status === "expiring_soon"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-emerald-200 bg-emerald-50 text-emerald-950";

        return (
          <li key={row.id} className="px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  {meta.iconSrc ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meta.iconSrc}
                        alt=""
                        aria-hidden
                        className="h-12 w-12 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  ) : null}
                  <p className="min-w-0 truncate font-medium text-stone-900">{meta.label}</p>
                </div>
                <time dateTime={row.expiry_date} className="block text-sm text-stone-700 tabular-nums">
                  {formatDateYmdUtc(row.expiry_date, locale)}
                </time>
                <p
                  className={cn(
                    "inline-flex max-w-full rounded-md border px-2 py-0.5 text-xs font-medium",
                    statusTone,
                  )}
                >
                  <span className="sr-only">{tAria("expiryStatus")}: </span>
                  {statusLabel}
                </p>
                {demoExpiryNoteKey ? (
                  <p className="text-sm text-stone-700">{tDemo(demoExpiryNoteKey)}</p>
                ) : null}
                {row.cost != null && row.cost !== "" ? (
                  <p className="text-sm text-stone-600 tabular-nums">
                    {typeof row.cost === "number" ? row.cost : row.cost} {tDemo("currencyCode")}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
