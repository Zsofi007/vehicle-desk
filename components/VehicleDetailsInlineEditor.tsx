"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { useRouter } from "@/lib/navigation";
import { updateVehicle, type VehicleActionState } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarMakeModelFields } from "@/components/CarMakeModelFields";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LicensePlateField } from "@/components/LicensePlateField";

type Props = {
  locale: AppLocale;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  odometer: number;
  vehicleType: string;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  hideReadOnly?: boolean;
};

function formatThousandsDots(digitsOnly: string) {
  const s = digitsOnly.replace(/^0+(?=\d)/, "");
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return <Button type="submit" disabled={pending}>{t("save")}</Button>;
}

export function VehicleDetailsInlineEditor({
  locale,
  vehicleId,
  make,
  model,
  year,
  licensePlate,
  odometer,
  vehicleType,
  editing: controlledEditing,
  onEditingChange,
  hideReadOnly,
}: Props) {
  const router = useRouter();
  const t = useTranslations("vehicles");
  const td = useTranslations("vehicleDetail");
  const te = useTranslations("errors");
  const tc = useTranslations("common");

  const [uncontrolledEditing, setUncontrolledEditing] = useState(false);
  const editing =
    typeof controlledEditing === "boolean" && typeof onEditingChange === "function"
      ? controlledEditing
      : uncontrolledEditing;
  const setEditing =
    typeof controlledEditing === "boolean" && typeof onEditingChange === "function"
      ? onEditingChange
      : setUncontrolledEditing;
  const [currentYear, setCurrentYear] = useState(String(year));
  const [currentPlate, setCurrentPlate] = useState(licensePlate);
  const [odoDigits, setOdoDigits] = useState(String(odometer));
  const [currentVehicleType, setCurrentVehicleType] = useState(vehicleType);
  const odoDisplayId = useId();

  const bound = updateVehicle.bind(null, locale, vehicleId);
  const [state, formAction] = useActionState(
    bound,
    undefined as VehicleActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    queueMicrotask(() => {
      setEditing(false);
      router.refresh();
    });
  }, [state, router, setEditing]);

  if (!editing) {
    if (hideReadOnly) return null;
    return (
      <section
        aria-labelledby="vehicle-info-heading"
        className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="vehicle-info-heading" className="text-base font-semibold text-stone-900">
            {td("info")}
          </h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {t("edit")}
          </Button>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-stone-700">{t("makeModel")}</dt>
            <dd className="text-stone-900">
              {make} {model}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-stone-700">{t("year")}</dt>
            <dd className="tabular-nums text-stone-900">{year}</dd>
          </div>
          <div>
            <dt className="font-medium text-stone-700">{t("vehicleType")}</dt>
            <dd className="text-stone-900">{t(`vehicleType_${vehicleType}`)}</dd>
          </div>
          <div>
            <dt className="font-medium text-stone-700">{t("plate")}</dt>
            <dd className="text-stone-900">{licensePlate}</dd>
          </div>
          <div>
            <dt className="font-medium text-stone-700">{t("odometer")}</dt>
            <dd className="tabular-nums text-stone-900">{odometer.toLocaleString(locale)} km</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="vehicle-info-heading"
      className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h2 id="vehicle-info-heading" className="text-base font-semibold text-stone-900">
        {td("info")}
      </h2>
      <form action={formAction} className="mt-4 grid gap-4">
        {state?.error === "validation" ? (
          <p className="text-sm text-red-800" role="alert">{te("validation")}</p>
        ) : null}
        {state?.error && state.error !== "validation" ? (
          <p className="text-sm text-red-800" role="alert">{state.error}</p>
        ) : null}

        <CarMakeModelFields
          makeName="make"
          modelName="model"
          initialMake={make}
          initialModel={model}
        />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-stone-800">{t("vehicleType")}</legend>
          <p className="text-xs text-slate-600">{t("vehicleTypeHint")}</p>
          <RadioGroup
            name="vehicle_type"
            value={currentVehicleType}
            onValueChange={setCurrentVehicleType}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(
              [
                "car_under_2t",
                "minivan",
                "truck",
                "motorcycle",
                "trailer",
                "bus",
                "electric_car",
                "other",
              ] as const
            ).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
              >
                <RadioGroupItem value={value} className="mt-0.5" />
                <span className="leading-5">{t(`vehicleType_${value}`)}</span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <label htmlFor="year" className="text-sm font-medium text-stone-800">{t("year")}</label>
            <Input
              id="year"
              name="year"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              type="text"
              inputMode="numeric"
              required
              maxLength={4}
              pattern="[0-9]*"
              placeholder="2000"
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="license_plate" className="text-sm font-medium text-stone-800">{t("plate")}</label>
            <LicensePlateField
              id="license_plate"
              name="license_plate"
              value={currentPlate}
              onChange={(e) => setCurrentPlate(e.target.value)}
              required
              maxLength={10}
              placeholder="AA 99 XYZ"
              className="placeholder:font-normal"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor={odoDisplayId} className="text-sm font-medium text-stone-800">{t("odometer")}</label>
          <input type="hidden" name="odometer" value={odoDigits} />
          <Input
            id={odoDisplayId}
            name="odometer_display"
            value={formatThousandsDots(odoDigits)}
            onChange={(e) => setOdoDigits(e.target.value.replace(/\D/g, "").slice(0, 7))}
            inputMode="numeric"
            required
            placeholder="100 000"
            maxLength={9}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="tabular-nums"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setEditing(false);
              setCurrentYear(String(year));
              setCurrentPlate(licensePlate);
              setOdoDigits(String(odometer));
              setCurrentVehicleType(vehicleType);
            }}
          >
            {tc("cancel")}
          </Button>
          <SaveButton />
        </div>
      </form>
    </section>
  );
}

