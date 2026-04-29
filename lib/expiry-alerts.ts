import "server-only";

import type { AppLocale } from "@/lib/i18n";

export function formatIsoDateForLocale(isoDate: string, locale: AppLocale) {
  // isoDate: YYYY-MM-DD
  const [y, m, d] = isoDate.split("-").map((v) => Number(v));
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(dt);
}

export function toIsoDateUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysUTC(base: Date, days: number) {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

