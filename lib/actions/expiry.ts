"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n";

const baseSchema = z.object({
  type: z.string().min(1).max(120),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ExpiryActionState = {
  error?: string;
};

function parseCost(formData: FormData):
  | { ok: true; value: number | null }
  | { ok: false } {
  const raw = formData.get("cost");
  if (raw === null || String(raw).trim() === "") {
    return { ok: true, value: null };
  }
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false };
  }
  return { ok: true, value: n };
}

export async function createExpiryItem(
  vehicleId: string,
  locale: AppLocale,
  _prev: ExpiryActionState | undefined,
  formData: FormData,
): Promise<ExpiryActionState> {
  const costParsed = parseCost(formData);
  if (!costParsed.ok) {
    return { error: "validation" };
  }

  const parsed = baseSchema.safeParse({
    type: formData.get("type"),
    expiry_date: formData.get("expiry_date"),
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expiry_items").insert({
    vehicle_id: vehicleId,
    type: parsed.data.type,
    expiry_date: parsed.data.expiry_date,
    cost: costParsed.value,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}

export async function updateExpiryItem(
  vehicleId: string,
  itemId: string,
  locale: AppLocale,
  _prev: ExpiryActionState | undefined,
  formData: FormData,
): Promise<ExpiryActionState> {
  const costParsed = parseCost(formData);
  if (!costParsed.ok) {
    return { error: "validation" };
  }

  const parsed = baseSchema.safeParse({
    type: formData.get("type"),
    expiry_date: formData.get("expiry_date"),
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("expiry_items")
    .update({
      type: parsed.data.type,
      expiry_date: parsed.data.expiry_date,
      cost: costParsed.value,
    })
    .eq("id", itemId)
    .eq("vehicle_id", vehicleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return {};
}

export async function deleteExpiryItem(
  vehicleId: string,
  itemId: string,
  locale: AppLocale,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("expiry_items")
    .delete()
    .eq("id", itemId)
    .eq("vehicle_id", vehicleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${locale}/vehicles/${vehicleId}`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}
