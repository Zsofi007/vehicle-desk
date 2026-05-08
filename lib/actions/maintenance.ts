"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";
import { processDocumentDeletionQueueForParent } from "@/lib/actions/documents";

const maintenanceTypeEnum = z.enum([
  "OIL_CHANGE",
  "BRAKES",
  "TIRES",
  "BATTERY",
  "FILTERS",
  "TIMING_BELT",
  "OTHER",
]);

const schema = z.object({
  type: maintenanceTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  odometer: z.coerce.number().int().min(0),
  notes: z.string().max(5000).optional(),
});

function parseOptionalPositiveInt(raw: FormDataEntryValue | null) {
  if (raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

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

  // If interval fields are present in the form, persist them as the per-vehicle override
  // for this maintenance type. Empty values clear the override.
  if (formData.has("interval_km") || formData.has("interval_days")) {
    const intervalKm = parseOptionalPositiveInt(formData.get("interval_km"));
    const intervalDays = parseOptionalPositiveInt(formData.get("interval_days"));

    if (intervalKm === null && intervalDays === null) {
      await supabase
        .from("maintenance_interval_overrides")
        .delete()
        .eq("vehicle_id", vehicleId)
        .eq("type", parsed.data.type);
    } else {
      await supabase.from("maintenance_interval_overrides").upsert(
        {
          vehicle_id: vehicleId,
          type: parsed.data.type,
          interval_km: intervalKm,
          interval_days: intervalDays,
          due_soon_km: null,
          due_soon_days: null,
        },
        { onConflict: "vehicle_id,type" },
      );
    }
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

  // If interval fields are present in the form, persist them as the per-vehicle override
  // for this maintenance type. Empty values clear the override.
  if (formData.has("interval_km") || formData.has("interval_days")) {
    const intervalKm = parseOptionalPositiveInt(formData.get("interval_km"));
    const intervalDays = parseOptionalPositiveInt(formData.get("interval_days"));

    if (intervalKm === null && intervalDays === null) {
      await supabase
        .from("maintenance_interval_overrides")
        .delete()
        .eq("vehicle_id", vehicleId)
        .eq("type", parsed.data.type);
    } else {
      await supabase.from("maintenance_interval_overrides").upsert(
        {
          vehicle_id: vehicleId,
          type: parsed.data.type,
          interval_km: intervalKm,
          interval_days: intervalDays,
          due_soon_km: null,
          due_soon_days: null,
        },
        { onConflict: "vehicle_id,type" },
      );
    }
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

  await processDocumentDeletionQueueForParent({ kind: "maintenance", parentId: recordId });

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}
