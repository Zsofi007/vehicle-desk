"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { DeleteVehicleButton } from "@/components/DeleteVehicleButton";
import { LicensePlate } from "@/components/LicensePlate";
import { VehicleMakeLogo } from "@/components/VehicleMakeLogo";
import { VehicleDetailsInlineEditor } from "@/components/VehicleDetailsInlineEditor";

type Props = {
  locale: AppLocale;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  odometer: number;
  vehicleType: string;
  editLabel: string;
  deleteConfirmLabel: string;
  deleteLabel: string;
};

export function VehicleDetailHeader({
  locale,
  vehicleId,
  make,
  model,
  year,
  licensePlate,
  odometer,
  vehicleType,
  editLabel,
  deleteConfirmLabel,
  deleteLabel,
}: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-1">
          <VehicleMakeLogo make={make} className="object-contain h-28 w-28" />

          <header>
            <span>
              <b>
                {make} {model}
              </b>{" "}
              - {year}
            </span>
            <div className="mt-1 flex flex-wrap items-center">
              <LicensePlate value={licensePlate} size="sm" />
            </div>
            <div className="mt-2 inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/service-icons/odometer.png"
                  alt=""
                  aria-hidden
                  className="h-5 w-5 object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <span className="tabular-nums font-medium">
                  {odometer.toLocaleString(locale)} km
                </span>
              </div>
          </header>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            {editLabel}
          </Button>
          <DeleteVehicleButton
            vehicleId={vehicleId}
            locale={locale}
            confirmLabel={deleteConfirmLabel}
            deleteLabel={deleteLabel}
          />
        </div>
      </div>

      <VehicleDetailsInlineEditor
        locale={locale}
        vehicleId={vehicleId}
        make={make}
        model={model}
        year={year}
        licensePlate={licensePlate}
        odometer={odometer}
        vehicleType={vehicleType}
        editing={editing}
        onEditingChange={setEditing}
        hideReadOnly
      />
    </>
  );
}

