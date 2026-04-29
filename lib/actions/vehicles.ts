"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { redirect } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";

const vehicleSchema = z.object({
  make: z.string().min(1).max(120),
  model: z.string().min(1).max(120),
  vehicle_type: z.enum([
    "car_under_2t",
    "minivan",
    "truck",
    "motorcycle",
    "trailer",
    "bus",
    "electric_car",
    "other",
  ]),
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

  const { error } = await supabase.from("vehicles").insert({
    user_id: user.id,
    make: parsed.data.make,
    model: parsed.data.model,
    vehicle_type: parsed.data.vehicle_type,
    year: parsed.data.year,
    license_plate: parsed.data.license_plate,
    odometer: parsed.data.odometer,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
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

  const parsed = vehicleSchema.safeParse({
    make: formData.get("make"),
    model: formData.get("model"),
    vehicle_type: formData.get("vehicle_type") ?? "car_under_2t",
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
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles`, "page");
  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}
