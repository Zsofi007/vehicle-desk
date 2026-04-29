import { getLocale, getTranslations } from "next-intl/server";

import {
  addUtcDays,
  formatUtcDateString,
  getExpiryStatus,
  utcTodayString,
} from "@/lib/dates";
import { formatMoneyAmount } from "@/lib/i18n";
import { formatDateYmdUtc } from "@/lib/format";
import type { ExpiryItem } from "@/types";

type Props = {
  items: ExpiryItem[];
};

export async function ExpiryList({ items }: Props) {
  const t = await getTranslations("expiry");
  const tStatus = await getTranslations("status");
  const tAria = await getTranslations("aria");
  const locale = await getLocale();

  const today = utcTodayString();
  const soonEnd = formatUtcDateString(addUtcDays(new Date(), 7));

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
        {t("empty")}
      </p>
    );
  }

  function expiryTypeMeta(type: string): { label: string; iconSrc?: string } {
    const key = type.trim().toLowerCase();
    if (key === "itp") return { label: t("type_itp"), iconSrc: "/service-icons/better-icons_24.png" };
    if (key === "rca") return { label: t("type_rca"), iconSrc: "/service-icons/better-icons_19.png" };
    if (key === "casco") return { label: t("type_casco"), iconSrc: "/service-icons/better-icons_25.png" };
    if (key === "vignette" || key === "vignetă" || key === "vigneta")
      return { label: t("type_vignette"), iconSrc: "/service-icons/better-icons_11.png" };
    if (key === "rovinietă" || key === "rovinieta")
      return { label: t("type_rovinieta"), iconSrc: "/service-icons/rovinieta.png" };
    if (key === "other") return { label: t("type_other"), iconSrc: "/service-icons/better-icons_12.png" };
    return { label: type };
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {items.map((row) => {
        const status = getExpiryStatus(row.expiry_date, today, soonEnd);
        const meta = expiryTypeMeta(row.type);
        const label =
          status === "expired"
            ? tStatus("badgeExpired")
            : status === "expiring_soon"
              ? tStatus("badgeSoon")
              : tStatus("badgeOk");
        const tone =
          status === "expired"
            ? "border-red-200 bg-red-50 text-red-900"
            : status === "expiring_soon"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-stone-200 bg-stone-50 text-stone-800";

        return (
          <li key={row.id} className="px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  {meta.iconSrc ? (
                    <span className="inline-flex h-12 w-12 items-center justify-center bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meta.iconSrc}
                        alt=""
                        aria-hidden
                        className="h-16 w-16 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  ) : null}
                  <p className="min-w-0 truncate font-medium text-stone-900">
                    {meta.label}
                  </p>
                </div>
                <time
                  dateTime={row.expiry_date}
                  className="block text-sm text-stone-700 tabular-nums"
                >
                  {formatDateYmdUtc(row.expiry_date, locale)}
                </time>
                <p className={`inline-flex max-w-full rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}>
                  <span className="sr-only">{tAria("expiryStatus")}: </span>
                  {label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-600">{t("cost")}</p>
                <p className="font-medium tabular-nums text-stone-900">
                  {formatMoneyAmount(
                    row.cost as string | number | null | undefined,
                    locale,
                  )}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
