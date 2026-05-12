"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { redirect } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";
/** Vehicle type enum and UI order: shared module (not re-exported here — `"use server"` strips non-actions for clients). */
import { VehicleType, VEHICLE_TYPES } from "@/lib/vehicle-type";

const vehicleSchema = z.object({
  make: z.string().min(1).max(120),
  model: z.string().min(1).max(120),
  vehicle_type: z.enum(VEHICLE_TYPES),
  year: z.coerce.number().int().min(1900).max(2100),
  license_plate: z.string().min(1).max(10),
  odometer: z.coerce.number().int().min(0).max(9_999_999),
});

export type VehicleActionState = {
  error?: string;
};

export async function createVehicle(
  locale: AppLocale,
  _prev: VehicleActionState | undefined,
  formData: FormData,
): Promise<VehicleActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const orgId = profile?.active_organization_id ? String(profile.active_organization_id) : null;
  if (!orgId) {
    return { error: "unauthorized" };
  }

  const parsed = vehicleSchema.safeParse({
    make: formData.get("make"),
    model: formData.get("model"),
    vehicle_type: formData.get("vehicle_type"),
    year: formData.get("year"),
    license_plate: formData.get("license_plate"),
    odometer: formData.get("odometer"),
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const { data: inserted, error } = await supabase
    .from("vehicles")
    .insert({
      user_id: user.id,
      organization_id: orgId,
      make: parsed.data.make,
      model: parsed.data.model,
      vehicle_type: parsed.data.vehicle_type,
      year: parsed.data.year,
      license_plate: parsed.data.license_plate,
      odometer: parsed.data.odometer,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    return { error: error?.message ?? "insert_failed" };
  }

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  revalidatePath(`/${locale}/vehicles/${inserted.id}`, "page");
  redirect({ href: `/vehicles/${inserted.id}`, locale });
  return {};
}

export async function deleteVehicle(vehicleId: string, locale: AppLocale) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  redirect({ href: "/vehicles", locale });
}

export async function updateVehicle(
  locale: AppLocale,
  vehicleId: string,
  _prev: VehicleActionState | undefined,
  formData: FormData,
): Promise<VehicleActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const orgId = profile?.active_organization_id ? String(profile.active_organization_id) : null;
  if (!orgId) {
    return { error: "unauthorized" };
  }

  const parsed = vehicleSchema.safeParse({
    make: formData.get("make"),
    model: formData.get("model"),
    vehicle_type: formData.get("vehicle_type") ?? VehicleType.CarUnder2t,
    year: formData.get("year"),
    license_plate: formData.get("license_plate"),
    odometer: formData.get("odometer"),
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      make: parsed.data.make,
      model: parsed.data.model,
      vehicle_type: parsed.data.vehicle_type,
      year: parsed.data.year,
      license_plate: parsed.data.license_plate,
      odometer: parsed.data.odometer,
    })
    .eq("id", vehicleId)
    .eq("organization_id", orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}

export async function updateVehicleOdometerOnly(
  locale: AppLocale,
  vehicleId: string,
  _prev: VehicleActionState | undefined,
  formData: FormData,
): Promise<VehicleActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const orgId = profile?.active_organization_id ? String(profile.active_organization_id) : null;
  if (!orgId) {
    return { error: "unauthorized" };
  }

  const parsed = z
    .object({
      odometer: z.coerce.number().int().min(0).max(9_999_999),
    })
    .safeParse({ odometer: formData.get("odometer") });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const { error } = await supabase
    .from("vehicles")
    .update({ odometer: parsed.data.odometer })
    .eq("id", vehicleId)
    .eq("organization_id", orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}
