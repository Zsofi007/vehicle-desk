/** Format a YYYY-MM-DD value as a local calendar date (UTC, no time shift). */
export function formatDateYmdUtc(ymd: string, locale: string): string {
  const parts = ymd.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return ymd;
  }
  const [y, m, d] = parts;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
