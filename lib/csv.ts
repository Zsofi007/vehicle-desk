export type CsvColumn<Row> = {
  header: string;
  get: (row: Row) => unknown;
};

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCell(raw: string): string {
  // RFC 4180-ish: quote if it contains comma, quote, or newline; double quotes inside.
  const needsQuotes = /[",\n\r]/.test(raw);
  if (!needsQuotes) return raw;
  return `"${raw.replaceAll('"', '""')}"`;
}

export function toCsv<Row>(rows: Row[], columns: CsvColumn<Row>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCell(normalizeCell(c.get(row))))
      .join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}

