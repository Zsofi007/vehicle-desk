import { addUtcDays, formatUtcDateString, getExpiryStatus } from "@/lib/dates";
import type { DashboardAlert } from "@/lib/queries";
import { DEMO_REFERENCE_YMD } from "./constants";
import { DEMO_VEHICLES, getAllDemoExpiries } from "./fixtures";

export function buildDemoAlerts(): DashboardAlert[] {
  const today = DEMO_REFERENCE_YMD;
  const soonEnd = formatUtcDateString(addUtcDays(new Date(`${today}T12:00:00.000Z`), 7));
  const vById = new Map(DEMO_VEHICLES.map((x) => [x.id, x]));
  const alerts: DashboardAlert[] = [];

  for (const row of getAllDemoExpiries()) {
    if (row.is_active === false) continue;
    const veh = vById.get(row.vehicle_id);
    if (!veh) continue;
    const st = getExpiryStatus(row.expiry_date, today, soonEnd);
    if (st === "expired") {
      alerts.push({
        kind: "expired",
        expiry: row,
        vehicle: {
          id: veh.id,
          make: veh.make,
          model: veh.model,
          license_plate: veh.license_plate,
        },
      });
    } else if (st === "expiring_soon") {
      alerts.push({
        kind: "expiry_soon",
        expiry: row,
        vehicle: {
          id: veh.id,
          make: veh.make,
          model: veh.model,
          license_plate: veh.license_plate,
        },
      });
    }
  }

  return alerts;
}
