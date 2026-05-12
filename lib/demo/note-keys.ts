/** Maintenance `notes` values use this prefix + `demo` namespace message key (e.g. `__DEMO_NOTE__maintLoganOil`). */
export const DEMO_NOTE_PREFIX = "__DEMO_NOTE__";

export function isDemoNoteKey(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(DEMO_NOTE_PREFIX);
}

export function demoNoteMessageKey(value: string): string {
  return value.slice(DEMO_NOTE_PREFIX.length);
}

/** Expiry row id → `demo` namespace key for an optional note line (demo read-only UI only). */
export const DEMO_EXPIRY_NOTE_KEYS: Record<string, string> = {
  "e1010001-0000-4000-8000-000000000001": "expLoganItp",
  "e1010002-0000-4000-8000-000000000002": "expLoganRca",
  "e1010003-0000-4000-8000-000000000003": "expLoganCasco",
  "e2020001-0000-4000-8000-000000000011": "expSprinterItp",
  "e2020002-0000-4000-8000-000000000012": "expSprinterRovinieta",
  "e3030001-0000-4000-8000-000000000021": "expPassatRca",
  "e3030002-0000-4000-8000-000000000022": "expPassatVignette",
  "e3030003-0000-4000-8000-000000000023": "expPassatItp",
  "e4040001-0000-4000-8000-000000000031": "expBmwItp",
  "e4040002-0000-4000-8000-000000000032": "expBmwOther",
};
