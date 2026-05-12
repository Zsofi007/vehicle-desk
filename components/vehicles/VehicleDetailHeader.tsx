"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import type { VehicleType } from "@/lib/vehicle-type";
import { Button } from "@/components/ui/button";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { LicensePlate } from "./LicensePlate";
import { VehicleMakeLogo } from "./VehicleMakeLogo";
import { VehicleDetailsInlineEditor } from "./VehicleDetailsInlineEditor";
import { VehicleTypeIcon } from "./VehicleTypeIcon";

type Props = {
  locale: AppLocale;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  odometer: number;
  vehicleType: VehicleType;
  editLabel: string;
  deleteConfirmLabel: string;
  deleteLabel: string;
  readOnly?: boolean;
};

function ReadOnlyVehicleHeader({
  locale,
  make,
  model,
  year,
  licensePlate,
  odometer,
  vehicleType,
}: Pick<
  Props,
  "locale" | "make" | "model" | "year" | "licensePlate" | "odometer" | "vehicleType"
>) {
  const t = useTranslations("vehicles");

  return (
    <div className="mb-4 flex flex-wrap items-start gap-4">
      <div className="flex items-center gap-3">
        <VehicleMakeLogo make={make} className="h-28 w-28 object-contain" />
        <VehicleTypeIcon type={vehicleType} className="size-11 sm:size-12" />
        <header>
          <span>
            <b>
              {make} {model}
            </b>{" "}
            · {year}
          </span>
          <p className="mt-1 text-sm text-stone-600">
            {t("vehicleType")}: {t(`vehicleType_${vehicleType}`)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
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
            <span className="font-medium tabular-nums">
              {odometer.toLocaleString(locale)} km
            </span>
          </div>
        </header>
      </div>
    </div>
  );
}

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
  readOnly = false,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (readOnly) {
    return (
      <ReadOnlyVehicleHeader
        locale={locale}
        make={make}
        model={model}
        year={year}
        licensePlate={licensePlate}
        odometer={odometer}
        vehicleType={vehicleType}
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <VehicleMakeLogo make={make} className="h-28 w-28 object-contain" />
          <header>
            <span>
              <b>
                {make} {model}
              </b>{" "}
              - {year}
            </span>
            <div className="mt-1 flex flex-wrap items-center">
              <LicensePlate value={licensePlate} size="sm" />
              <VehicleTypeIcon type={vehicleType} className="ml-2 size-11 sm:size-12" />
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
              <span className="font-medium tabular-nums">
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

