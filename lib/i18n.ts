import { routing } from "@/i18n/routing";

export const locales = routing.locales;
export type AppLocale = (typeof locales)[number];

/** Locale-aware amount display (no currency symbol; cost is generic). */
export function formatMoneyAmount(
  value: string | number | null | undefined,
  locale: string,
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function localeLabel(locale: AppLocale): string {
  const labels: Record<AppLocale, string> = {
    en: "English",
    hu: "Magyar",
    ro: "Română",
  };
  return labels[locale];
}
