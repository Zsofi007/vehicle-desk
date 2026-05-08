"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { AppLocale } from "@/lib/i18n";
import { MAINTENANCE_TYPE_KEYS, type MaintenanceTypeKey } from "@/lib/type-keys";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const typeEnum = z.enum(MAINTENANCE_TYPE_KEYS);

const kmSchema = z
  .union([z.string().trim().min(1), z.literal(""), z.null(), z.undefined()])
  .transform((v) => {
    const raw = v === null || v === undefined ? "" : String(v).trim();
    if (raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return NaN;
    return Math.floor(n);
  });

const daysSchema = kmSchema;

const dueSoonKmSchema = kmSchema;
const dueSoonDaysSchema = kmSchema;

export type IntervalRow = {
  type: MaintenanceTypeKey;
  interval_km: number | null;
  interval_days: number | null;
  due_soon_km: number | null;
  due_soon_days: number | null;
};

export type EffectiveVehicleInterval = {
  type: MaintenanceTypeKey;
  interval_km: number | null;
  interval_days: number | null;
  source: "override" | "default" | "none";
};

export async function getEffectiveMaintenanceIntervalsForVehicle(vehicleId: string) {
  const parsed = z.object({ vehicleId: z.string().uuid() }).safeParse({ vehicleId });
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id,organization_id,odometer")
    .eq("id", parsed.data.vehicleId)
    .maybeSingle();
  if (vehicleError || !vehicle?.id) return { error: "notFound" as const };

  const orgId = String((vehicle as any).organization_id ?? "");
  if (!orgId) return { error: "forbidden" as const };

  const { data: defaults } = await supabase
    .from("maintenance_interval_defaults")
    .select("type,interval_km,interval_days")
    .eq("organization_id", orgId);

  const { data: overrides } = await supabase
    .from("maintenance_interval_overrides")
    .select("type,interval_km,interval_days")
    .eq("vehicle_id", parsed.data.vehicleId);

  const defaultByType = new Map(
    (defaults ?? []).map((r: any) => [String(r.type), r] as const),
  );
  const overrideByType = new Map(
    (overrides ?? []).map((r: any) => [String(r.type), r] as const),
  );

  const effective: EffectiveVehicleInterval[] = MAINTENANCE_TYPE_KEYS.map((type) => {
    const o = overrideByType.get(type);
    if (o) {
      return {
        type,
        interval_km: o.interval_km ?? null,
        interval_days: o.interval_days ?? null,
        source: "override",
      };
    }
    const d = defaultByType.get(type);
    if (d) {
      return {
        type,
        interval_km: d.interval_km ?? null,
        interval_days: d.interval_days ?? null,
        source: "default",
      };
    }
    return { type, interval_km: null, interval_days: null, source: "none" };
  });

  return {
    ok: true as const,
    currentOdometer: Number((vehicle as any).odometer ?? 0),
    intervals: effective,
  };
}

export async function upsertOrgMaintenanceIntervalDefault(params: {
  locale: AppLocale;
  organizationId: string;
  type: MaintenanceTypeKey;
  intervalKm: unknown;
  intervalDays: unknown;
  dueSoonKm: unknown;
  dueSoonDays: unknown;
}) {
  const parsed = z
    .object({
      organizationId: z.string().uuid(),
      type: typeEnum,
      intervalKm: kmSchema,
      intervalDays: daysSchema,
      dueSoonKm: dueSoonKmSchema,
      dueSoonDays: dueSoonDaysSchema,
    })
    .safeParse(params);

  if (!parsed.success) return { error: "validation" as const };
  if (
    Number.isNaN(parsed.data.intervalKm) ||
    Number.isNaN(parsed.data.intervalDays) ||
    Number.isNaN(parsed.data.dueSoonKm) ||
    Number.isNaN(parsed.data.dueSoonDays)
  ) {
    return { error: "validation" as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const payload: Record<string, unknown> = {
    organization_id: parsed.data.organizationId,
    type: parsed.data.type,
    interval_km: parsed.data.intervalKm,
    interval_days: parsed.data.intervalDays,
    due_soon_km: parsed.data.dueSoonKm ?? undefined,
    due_soon_days: parsed.data.dueSoonDays ?? undefined,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("maintenance_interval_defaults")
    .upsert(payload, { onConflict: "organization_id,type" });
  if (error) return { error: "error" as const };

  revalidatePath(`/${params.locale}/settings`, "page");
  revalidatePath(`/${params.locale}/dashboard`, "page");
  return { ok: true as const };
}

export async function upsertVehicleMaintenanceIntervalOverride(params: {
  locale: AppLocale;
  vehicleId: string;
  type: MaintenanceTypeKey;
  intervalKm: unknown;
  intervalDays: unknown;
  dueSoonKm: unknown;
  dueSoonDays: unknown;
}) {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      type: typeEnum,
      intervalKm: kmSchema,
      intervalDays: daysSchema,
      dueSoonKm: dueSoonKmSchema,
      dueSoonDays: dueSoonDaysSchema,
    })
    .safeParse(params);

  if (!parsed.success) return { error: "validation" as const };
  if (
    Number.isNaN(parsed.data.intervalKm) ||
    Number.isNaN(parsed.data.intervalDays) ||
    Number.isNaN(parsed.data.dueSoonKm) ||
    Number.isNaN(parsed.data.dueSoonDays)
  ) {
    return { error: "validation" as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const payload: Record<string, unknown> = {
    vehicle_id: parsed.data.vehicleId,
    type: parsed.data.type,
    interval_km: parsed.data.intervalKm,
    interval_days: parsed.data.intervalDays,
    due_soon_km: parsed.data.dueSoonKm,
    due_soon_days: parsed.data.dueSoonDays,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("maintenance_interval_overrides")
    .upsert(payload, { onConflict: "vehicle_id,type" });
  if (error) return { error: "error" as const };

  revalidatePath(`/${params.locale}/vehicles/${params.vehicleId}`, "page");
  revalidatePath(`/${params.locale}/dashboard`, "page");
  return { ok: true as const };
}

export async function deleteVehicleMaintenanceIntervalOverride(params: {
  locale: AppLocale;
  vehicleId: string;
  type: MaintenanceTypeKey;
}) {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      type: typeEnum,
    })
    .safeParse(params);
  if (!parsed.success) return { error: "validation" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const { error } = await supabase
    .from("maintenance_interval_overrides")
    .delete()
    .eq("vehicle_id", parsed.data.vehicleId)
    .eq("type", parsed.data.type);
  if (error) return { error: "error" as const };

  revalidatePath(`/${params.locale}/vehicles/${params.vehicleId}`, "page");
  revalidatePath(`/${params.locale}/dashboard`, "page");
  return { ok: true as const };
}

