"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";

const schema = z.object({
  type: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  odometer: z.coerce.number().int().min(0),
  notes: z.string().max(5000).optional(),
});

export type MaintenanceActionState = {
  error?: string;
};

export async function createMaintenanceRecord(
  vehicleId: string,
  locale: AppLocale,
  _prev: MaintenanceActionState | undefined,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const notesRaw = formData.get("notes");
  const parsed = schema.safeParse({
    type: formData.get("type"),
    date: formData.get("date"),
    odometer: formData.get("odometer"),
    notes:
      typeof notesRaw === "string" && notesRaw.trim() !== ""
        ? notesRaw
        : undefined,
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("maintenance_records").insert({
    vehicle_id: vehicleId,
    type: parsed.data.type,
    date: parsed.data.date,
    odometer: parsed.data.odometer,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}

export async function updateMaintenanceRecord(
  vehicleId: string,
  recordId: string,
  locale: AppLocale,
  _prev: MaintenanceActionState | undefined,
  formData: FormData,
): Promise<MaintenanceActionState> {
  const notesRaw = formData.get("notes");
  const parsed = schema.safeParse({
    type: formData.get("type"),
    date: formData.get("date"),
    odometer: formData.get("odometer"),
    notes:
      typeof notesRaw === "string" && notesRaw.trim() !== ""
        ? notesRaw
        : undefined,
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update({
      type: parsed.data.type,
      date: parsed.data.date,
      odometer: parsed.data.odometer,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", recordId)
    .eq("vehicle_id", vehicleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}

export async function deleteMaintenanceRecord(
  vehicleId: string,
  recordId: string,
  locale: AppLocale,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("maintenance_records")
    .delete()
    .eq("id", recordId)
    .eq("vehicle_id", vehicleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}
