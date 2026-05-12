import type { MaintenanceDueRow } from "@/lib/queries";
import { addUtcDays, formatUtcDateString } from "@/lib/dates";
import type { ExpiryItem, MaintenanceRecord, Vehicle } from "@/types";
import { VehicleType } from "@/lib/vehicle-type";

import { DEMO_REFERENCE_YMD } from "./constants";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000002";

function ts(isoDate: string) {
  return `${isoDate}T10:00:00.000Z`;
}

/** Four fictional RO/EU-style vehicles with mixed types and odometer freshness. */
export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "d1111111-1111-4111-8111-111111111101",
    user_id: DEMO_USER_ID,
    organization_id: DEMO_ORG_ID,
    make: "Dacia",
    model: "Logan 1.5 dCi",
    vehicle_type: VehicleType.CarUnder2t,
    year: 2019,
    license_plate: "B 01 VDS",
    odometer: 185_420,
    created_at: ts("2025-01-15"),
    updated_at: ts("2026-04-01"),
    created_by: null,
    updated_by: null,
    last_odometer_update_at: ts("2025-11-20"),
    last_odometer_reminder_sent_at: null,
  },
  {
    id: "d2222222-2222-4222-8222-222222222202",
    user_id: DEMO_USER_ID,
    organization_id: DEMO_ORG_ID,
    make: "Mercedes-Benz",
    model: "Sprinter 316",
    vehicle_type: VehicleType.Truck,
    year: 2018,
    license_plate: "B 99 MKT",
    odometer: 342_100,
    created_at: ts("2025-02-10"),
    updated_at: ts("2026-05-08"),
    created_by: null,
    updated_by: null,
    last_odometer_update_at: ts("2026-05-08"),
    last_odometer_reminder_sent_at: null,
  },
  {
    id: "d3333333-3333-4333-8333-333333333303",
    user_id: DEMO_USER_ID,
    organization_id: DEMO_ORG_ID,
    make: "Volkswagen",
    model: "Passat Variant",
    vehicle_type: VehicleType.CarUnder2t,
    year: 2021,
    license_plate: "B 22 XPZ",
    odometer: 89_200,
    created_at: ts("2025-03-01"),
    updated_at: ts("2026-04-20"),
    created_by: null,
    updated_by: null,
    last_odometer_update_at: ts("2026-04-18"),
    last_odometer_reminder_sent_at: null,
  },
  {
    id: "d4444444-4444-4444-8444-444444444404",
    user_id: DEMO_USER_ID,
    organization_id: DEMO_ORG_ID,
    make: "BMW",
    model: "R 1250 GS",
    vehicle_type: VehicleType.Motorcycle,
    year: 2023,
    license_plate: "B 55 MTR",
    odometer: 12_450,
    created_at: ts("2025-06-01"),
    updated_at: ts("2026-03-01"),
    created_by: null,
    updated_by: null,
    last_odometer_update_at: ts("2025-08-10"),
    last_odometer_reminder_sent_at: null,
  },
];

export const DEMO_MAINTENANCE_BY_VEHICLE: Record<string, MaintenanceRecord[]> = {
  "d1111111-1111-4111-8111-111111111101": [
    {
      id: "m1010001-0000-4000-8000-000000000001",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "OIL_CHANGE",
      date: "2025-08-12",
      odometer: 178_000,
      notes: "__DEMO_NOTE__maintLoganOil",
      created_at: ts("2025-08-12"),
      updated_at: ts("2025-08-12"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m1010002-0000-4000-8000-000000000002",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "BRAKES",
      date: "2025-11-05",
      odometer: 182_100,
      notes: "__DEMO_NOTE__maintLoganBrakes",
      created_at: ts("2025-11-05"),
      updated_at: ts("2025-11-05"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m1010003-0000-4000-8000-000000000003",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "FILTERS",
      date: "2026-01-20",
      odometer: 184_200,
      notes: "__DEMO_NOTE__maintLoganFilters",
      created_at: ts("2026-01-20"),
      updated_at: ts("2026-01-20"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d2222222-2222-4222-8222-222222222202": [
    {
      id: "m2020001-0000-4000-8000-000000000011",
      vehicle_id: "d2222222-2222-4222-8222-222222222202",
      type: "OIL_CHANGE",
      date: "2025-12-01",
      odometer: 338_000,
      notes: "__DEMO_NOTE__maintSprinterOil",
      created_at: ts("2025-12-01"),
      updated_at: ts("2025-12-01"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m2020002-0000-4000-8000-000000000012",
      vehicle_id: "d2222222-2222-4222-8222-222222222202",
      type: "TIRES",
      date: "2026-02-15",
      odometer: 340_500,
      notes: "__DEMO_NOTE__maintSprinterTires",
      created_at: ts("2026-02-15"),
      updated_at: ts("2026-02-15"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d3333333-3333-4333-8333-333333333303": [
    {
      id: "m3030001-0000-4000-8000-000000000021",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "OIL_CHANGE",
      date: "2025-10-01",
      odometer: 82_000,
      notes: "__DEMO_NOTE__maintPassatOil",
      created_at: ts("2025-10-01"),
      updated_at: ts("2025-10-01"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m3030002-0000-4000-8000-000000000022",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "TIMING_BELT",
      date: "2025-04-12",
      odometer: 76_500,
      notes: "__DEMO_NOTE__maintPassatBelt",
      created_at: ts("2025-04-12"),
      updated_at: ts("2025-04-12"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m3030003-0000-4000-8000-000000000023",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "BATTERY",
      date: "2026-03-28",
      odometer: 88_900,
      notes: "__DEMO_NOTE__maintPassatBattery",
      created_at: ts("2026-03-28"),
      updated_at: ts("2026-03-28"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d4444444-4444-4444-8444-444444444404": [
    {
      id: "m4040001-0000-4000-8000-000000000031",
      vehicle_id: "d4444444-4444-4444-8444-444444444404",
      type: "OIL_CHANGE",
      date: "2025-09-20",
      odometer: 9_800,
      notes: "__DEMO_NOTE__maintBmwOil",
      created_at: ts("2025-09-20"),
      updated_at: ts("2025-09-20"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "m4040002-0000-4000-8000-000000000032",
      vehicle_id: "d4444444-4444-4444-8444-444444444404",
      type: "TIRES",
      date: "2026-01-10",
      odometer: 11_200,
      notes: "__DEMO_NOTE__maintBmwTires",
      created_at: ts("2026-01-10"),
      updated_at: ts("2026-01-10"),
      created_by: null,
      updated_by: null,
    },
  ],
};

export const DEMO_EXPIRIES_BY_VEHICLE: Record<string, ExpiryItem[]> = {
  "d1111111-1111-4111-8111-111111111101": [
    {
      id: "e1010001-0000-4000-8000-000000000001",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "ITP",
      expiry_date: "2026-03-01",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-03-01"),
      updated_at: ts("2025-03-01"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e1010002-0000-4000-8000-000000000002",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "RCA",
      expiry_date: "2026-05-14",
      cost: 420,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-05-14"),
      updated_at: ts("2025-05-14"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e1010003-0000-4000-8000-000000000003",
      vehicle_id: "d1111111-1111-4111-8111-111111111101",
      type: "CASCO",
      expiry_date: "2026-11-30",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-11-30"),
      updated_at: ts("2025-11-30"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d2222222-2222-4222-8222-222222222202": [
    {
      id: "e2020001-0000-4000-8000-000000000011",
      vehicle_id: "d2222222-2222-4222-8222-222222222202",
      type: "ITP",
      expiry_date: "2026-05-12",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-05-12"),
      updated_at: ts("2025-05-12"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e2020002-0000-4000-8000-000000000012",
      vehicle_id: "d2222222-2222-4222-8222-222222222202",
      type: "ROVINIETA",
      expiry_date: "2026-09-01",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-09-01"),
      updated_at: ts("2025-09-01"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d3333333-3333-4333-8333-333333333303": [
    {
      id: "e3030001-0000-4000-8000-000000000021",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "RCA",
      expiry_date: "2026-02-28",
      cost: 380,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-02-28"),
      updated_at: ts("2025-02-28"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e3030002-0000-4000-8000-000000000022",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "VIGNETTE",
      expiry_date: "2026-05-15",
      cost: 17,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-05-15"),
      updated_at: ts("2025-05-15"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e3030003-0000-4000-8000-000000000023",
      vehicle_id: "d3333333-3333-4333-8333-333333333303",
      type: "ITP",
      expiry_date: "2027-01-10",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2026-01-10"),
      updated_at: ts("2026-01-10"),
      created_by: null,
      updated_by: null,
    },
  ],
  "d4444444-4444-4444-8444-444444444404": [
    {
      id: "e4040001-0000-4000-8000-000000000031",
      vehicle_id: "d4444444-4444-4444-8444-444444444404",
      type: "ITP",
      expiry_date: "2027-06-01",
      cost: null,
      is_active: true,
      negated_at: null,
      created_at: ts("2026-06-01"),
      updated_at: ts("2026-06-01"),
      created_by: null,
      updated_by: null,
    },
    {
      id: "e4040002-0000-4000-8000-000000000032",
      vehicle_id: "d4444444-4444-4444-8444-444444444404",
      type: "OTHER",
      expiry_date: "2026-05-08",
      cost: 50,
      is_active: true,
      negated_at: null,
      created_at: ts("2025-05-08"),
      updated_at: ts("2025-05-08"),
      created_by: null,
      updated_by: null,
    },
  ],
};

export function getDemoMaintenanceForVehicle(vehicleId: string): MaintenanceRecord[] {
  return DEMO_MAINTENANCE_BY_VEHICLE[vehicleId] ?? [];
}

export function getDemoExpiryItemsForVehicle(vehicleId: string): ExpiryItem[] {
  return DEMO_EXPIRIES_BY_VEHICLE[vehicleId] ?? [];
}

export function getAllDemoExpiries(): ExpiryItem[] {
  return Object.values(DEMO_EXPIRIES_BY_VEHICLE).flat();
}

/** Dashboard-style maintenance rows (illustrative; not from DB RPC). */
export const DEMO_MAINTENANCE_DUE: MaintenanceDueRow[] = [
  {
    vehicle_id: "d1111111-1111-4111-8111-111111111101",
    type: "OIL_CHANGE",
    last_date: "2025-08-12",
    last_odometer: 178_000,
    current_odometer: 185_420,
    interval_km: 10_000,
    interval_days: 365,
    due_soon_km: 1000,
    due_soon_days: 14,
    next_due_odometer: 188_000,
    next_due_date: "2026-08-12",
    status: "overdue",
    reason: "km",
  },
  {
    vehicle_id: "d2222222-2222-4222-8222-222222222202",
    type: "OIL_CHANGE",
    last_date: "2025-12-01",
    last_odometer: 338_000,
    current_odometer: 342_100,
    interval_km: 10_000,
    interval_days: 180,
    due_soon_km: 1000,
    due_soon_days: 14,
    next_due_odometer: 348_000,
    next_due_date: "2026-05-28",
    status: "due_soon",
    reason: "km",
  },
];

export function getDemoUpcomingExpiriesCount(): number {
  const today = DEMO_REFERENCE_YMD;
  const end = formatUtcDateString(addUtcDays(new Date(`${today}T12:00:00.000Z`), 7));
  return getAllDemoExpiries().filter(
    (e) =>
      e.is_active !== false &&
      e.expiry_date >= today &&
      e.expiry_date <= end,
  ).length;
}

export function getDemoStaleVehicleIds(): Set<string> {
  const demoNow = new Date(`${DEMO_REFERENCE_YMD}T12:00:00.000Z`);
  const cutoff = demoNow.getTime() - 90 * 24 * 60 * 60 * 1000;
  const stale = new Set<string>();
  for (const v of DEMO_VEHICLES) {
    const t = v.last_odometer_update_at
      ? new Date(v.last_odometer_update_at).getTime()
      : 0;
    if (t && t < cutoff) stale.add(v.id);
  }
  return stale;
}
