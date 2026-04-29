/** Calendar dates in UTC (YYYY-MM-DD) for consistent DB comparisons. */

export function utcTodayString(): string {
  const n = new Date();
  return formatUtcDateString(n);
}

export function formatUtcDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function compareDateStrings(a: string, b: string): number {
  return a.localeCompare(b);
}

export type ExpiryStatus = "expired" | "expiring_soon" | "ok";

export function getExpiryStatus(
  expiryDateYmd: string,
  todayYmd: string,
  soonEndYmd: string,
): ExpiryStatus {
  if (compareDateStrings(expiryDateYmd, todayYmd) < 0) return "expired";
  if (
    compareDateStrings(expiryDateYmd, todayYmd) >= 0 &&
    compareDateStrings(expiryDateYmd, soonEndYmd) <= 0
  ) {
    return "expiring_soon";
  }
  return "ok";
}
