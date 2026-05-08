import JSZip from "jszip";
import { NextResponse } from "next/server";

import { toCsv } from "@/lib/csv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExpiryItem, MaintenanceRecord, Vehicle } from "@/types";

type OrgRow = {
  role: string | null;
  organization:
    | { id: string; name: string | null }
    | Array<{ id: string; name: string | null }>
    | null;
};

function ymdUtc(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const preferredOrgId = profile?.active_organization_id
    ? String(profile.active_organization_id)
    : null;

  const { data: orgRows, error: orgError } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations (
        id,
        name
      )
    `,
    )
    .eq("user_id", user.id);

  if (orgError) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }

  const orgs = (orgRows ?? [])
    .map((r: OrgRow) => {
      const org = Array.isArray(r.organization) ? r.organization[0] : r.organization;
      if (!org?.id) return null;
      return {
        id: String(org.id),
        name: String(org.name ?? ""),
        role: String(r.role ?? "member"),
      };
    })
    .filter((x): x is { id: string; name: string; role: string } => Boolean(x));

  if (orgs.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const preferredOrg =
    preferredOrgId ? orgs.find((o) => o.id === preferredOrgId) ?? null : null;
  const selected =
    preferredOrg ??
    [...orgs].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))[0]!;

  const organizationId = selected.id;

  const { data: vehicles, error: vError } = await supabase
    .from("vehicles")
    .select(
      "id,make,model,year,license_plate,odometer,vehicle_type,created_at,updated_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (vError) return NextResponse.json({ error: "error" }, { status: 500 });

  const vehicleRows = (vehicles ?? []) as unknown as Array<
    Pick<
      Vehicle,
      | "id"
      | "make"
      | "model"
      | "year"
      | "license_plate"
      | "odometer"
      | "vehicle_type"
      | "created_at"
      | "updated_at"
    >
  >;

  const vehicleIds = vehicleRows.map((v) => String(v.id));

  const { data: maintenance, error: mError } = vehicleIds.length
    ? await supabase
        .from("maintenance_records")
        .select("id,vehicle_id,type,date,odometer,notes,created_at,updated_at")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null as unknown as null };
  if (mError) return NextResponse.json({ error: "error" }, { status: 500 });

  const maintenanceRows = (maintenance ?? []) as unknown as Array<
    Pick<
      MaintenanceRecord,
      "id" | "vehicle_id" | "type" | "date" | "odometer" | "notes" | "created_at" | "updated_at"
    >
  >;

  const { data: expiries, error: eError } = vehicleIds.length
    ? await supabase
        .from("expiry_items")
        .select(
          "id,vehicle_id,type,expiry_date,cost,is_active,negated_at,created_at,updated_at",
        )
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null as unknown as null };
  if (eError) return NextResponse.json({ error: "error" }, { status: 500 });

  const expiryRows = (expiries ?? []) as unknown as Array<
    Pick<
      ExpiryItem,
      | "id"
      | "vehicle_id"
      | "type"
      | "expiry_date"
      | "cost"
      | "is_active"
      | "negated_at"
      | "created_at"
      | "updated_at"
    >
  >;

  const vehiclesCsv = toCsv(vehicleRows, [
    { header: "id", get: (r) => r.id },
    { header: "make", get: (r) => r.make },
    { header: "model", get: (r) => r.model },
    { header: "year", get: (r) => r.year },
    { header: "license_plate", get: (r) => r.license_plate },
    { header: "odometer", get: (r) => r.odometer },
    { header: "vehicle_type", get: (r) => r.vehicle_type },
    { header: "created_at", get: (r) => r.created_at },
    { header: "updated_at", get: (r) => r.updated_at },
  ]);

  const maintenanceCsv = toCsv(maintenanceRows, [
    { header: "id", get: (r) => r.id },
    { header: "vehicle_id", get: (r) => r.vehicle_id },
    { header: "type", get: (r) => r.type },
    { header: "date", get: (r) => r.date },
    { header: "odometer", get: (r) => r.odometer },
    { header: "notes", get: (r) => r.notes },
    { header: "created_at", get: (r) => r.created_at },
    { header: "updated_at", get: (r) => r.updated_at },
  ]);

  const expiriesCsv = toCsv(expiryRows, [
    { header: "id", get: (r) => r.id },
    { header: "vehicle_id", get: (r) => r.vehicle_id },
    { header: "type", get: (r) => r.type },
    { header: "expiry_date", get: (r) => r.expiry_date },
    { header: "cost", get: (r) => r.cost },
    { header: "is_active", get: (r) => r.is_active ?? null },
    { header: "negated_at", get: (r) => r.negated_at ?? null },
    { header: "created_at", get: (r) => r.created_at },
    { header: "updated_at", get: (r) => r.updated_at },
  ]);

  const zip = new JSZip();
  zip.file("vehicles.csv", vehiclesCsv);
  zip.file("maintenance_records.csv", maintenanceCsv);
  zip.file("expiry_items.csv", expiriesCsv);

  const bytes = await zip.generateAsync({ type: "uint8array" });

  const filename = `vehicle-desk-export_${organizationId}_${ymdUtc()}.zip`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

