import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addUtcDays,
  formatUtcDateString,
  getExpiryStatus,
  utcTodayString,
} from "@/lib/dates";
import type { ExpiryItem, MaintenanceRecord, Vehicle } from "@/types";

export async function getVehiclesForOrg(organizationId: string): Promise<Vehicle[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function getVehicleForOrg(
  organizationId: string,
  vehicleId: string,
): Promise<Vehicle | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) throw error;
  return data as Vehicle | null;
}

export async function getMaintenanceForVehicle(
  vehicleId: string,
): Promise<MaintenanceRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("odometer", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MaintenanceRecord[];
}

export async function getExpiryItemsForVehicle(
  vehicleId: string,
): Promise<ExpiryItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expiry_items")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("is_active", { ascending: false })
    .order("expiry_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ExpiryItem[];
}

export type ExpiryWithVehicle = ExpiryItem & {
  vehicle: Pick<Vehicle, "make" | "model" | "license_plate">;
};

/** Expiries due in the next 7 days (inclusive), calendar UTC. */
export async function getUpcomingExpiriesForOrg(
  organizationId: string,
): Promise<ExpiryWithVehicle[]> {
  const vehicles = await getVehiclesForOrg(organizationId);
  const ids = vehicles.map((v) => v.id);
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const today = utcTodayString();
  const end = formatUtcDateString(addUtcDays(new Date(), 7));

  const { data, error } = await supabase
    .from("expiry_items")
    .select(
      `
      *,
      vehicle:vehicles (
        make,
        model,
        license_plate
      )
    `,
    )
    .in("vehicle_id", ids)
    .eq("is_active", true)
    .gte("expiry_date", today)
    .lte("expiry_date", end)
    .order("expiry_date", { ascending: true });

  if (error) throw error;

  type Row = ExpiryItem & {
    vehicle: Pick<Vehicle, "make" | "model" | "license_plate"> | null;
  };

  return (data ?? []).map((row: Row) => {
    const { vehicle, ...rest } = row;
    return {
      ...(rest as ExpiryItem),
      vehicle: vehicle ?? {
        make: "",
        model: "",
        license_plate: "",
      },
    };
  });
}

export type DashboardAlert = {
  kind: "expiry_soon" | "expired";
  expiry: ExpiryItem;
  vehicle: Pick<Vehicle, "id" | "make" | "model" | "license_plate">;
};

export async function getAlertsForOrg(organizationId: string): Promise<
  DashboardAlert[]
> {
  const vehicles = await getVehiclesForOrg(organizationId);
  const ids = vehicles.map((v) => v.id);
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const today = utcTodayString();
  const soonEnd = formatUtcDateString(addUtcDays(new Date(), 7));

  const { data, error } = await supabase
    .from("expiry_items")
    .select(
      `
      *,
      vehicle:vehicles (
        id,
        make,
        model,
        license_plate
      )
    `,
    )
    .in("vehicle_id", ids)
    .eq("is_active", true)
    .order("expiry_date", { ascending: true });

  if (error) throw error;

  type Row = ExpiryItem & {
    vehicle: Pick<Vehicle, "id" | "make" | "model" | "license_plate"> | null;
  };

  const alerts: DashboardAlert[] = [];
  for (const row of (data ?? []) as Row[]) {
    const v = row.vehicle;
    if (!v?.id) continue;
    const status = getExpiryStatus(row.expiry_date, today, soonEnd);
    if (status === "expired") {
      alerts.push({
        kind: "expired",
        expiry: row,
        vehicle: v,
      });
    } else if (status === "expiring_soon") {
      alerts.push({
        kind: "expiry_soon",
        expiry: row,
        vehicle: v,
      });
    }
  }
  return alerts;
}
