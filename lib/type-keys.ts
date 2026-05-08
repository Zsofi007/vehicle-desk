export const MAINTENANCE_TYPE_KEYS = [
  "OIL_CHANGE",
  "FILTERS",
  "BRAKES",
  "TIRES",
  "BATTERY",
  "TIMING_BELT",
  "OTHER",
] as const;

export type MaintenanceTypeKey = (typeof MAINTENANCE_TYPE_KEYS)[number];

export const EXPIRY_TYPE_KEYS = [
  "ITP",
  "RCA",
  "CASCO",
  "VIGNETTE",
  "ROVINIETA",
  "OTHER",
] as const;

export type ExpiryTypeKey = (typeof EXPIRY_TYPE_KEYS)[number];

