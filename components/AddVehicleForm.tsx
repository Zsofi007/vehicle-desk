"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createVehicle,
  type VehicleActionState,
} from "@/lib/actions/vehicles";
import type { AppLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarMakeModelFields } from "@/components/CarMakeModelFields";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LicensePlateField } from "@/components/LicensePlateField";

type Props = {
  locale: AppLocale;
  onSuccess?: () => void;
};

function formatThousandsDots(digitsOnly: string) {
  const s = digitsOnly.replace(/^0+(?=\d)/, "");
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      {t("submit")}
    </Button>
  );
}

export function AddVehicleForm({ locale, onSuccess }: Props) {
  const t = useTranslations("vehicles");
  const te = useTranslations("errors");
  const bound = createVehicle.bind(null, locale);
  const [state, formAction] = useActionState(
    bound,
    undefined as VehicleActionState | undefined,
  );

  const odoDisplayId = useId();
  const [odoDigits, setOdoDigits] = useState("");
  const odoDisplay = formatThousandsDots(odoDigits);

  const didReportSuccess = useRef(false);
  useEffect(() => {
    if (didReportSuccess.current) return;
    if (!state) return;
    if (state.error) return;
    didReportSuccess.current = true;
    onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-2">
      {state?.error === "validation" ? (
        <p className="text-sm text-red-800" role="alert">
          {te("validation")}
        </p>
      ) : null}
      {state?.error === "unauthorized" ? (
        <p className="text-sm text-red-800" role="alert">
          {te("unauthorized")}
        </p>
      ) : null}
      {state?.error &&
      state.error !== "validation" &&
      state.error !== "unauthorized" ? (
        <p className="text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <CarMakeModelFields />

      <fieldset className="grid gap-2 mt-2">
        <legend className="text-sm font-medium text-stone-800">
          {t("vehicleType")}
        </legend>
        <p className="text-xs text-slate-600">{t("vehicleTypeHint")}</p>
        <RadioGroup
          name="vehicle_type"
          defaultValue="car_under_2t"
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
          <label htmlFor="year" className="text-sm font-medium text-stone-800">
            {t("year")}
          </label>
          <Input
            id="year"
            name="year"
            type="text"
            inputMode="numeric"
            required
            min={1900}
            max={2100}
            step={1}
            pattern="[0-9]*"
            placeholder="2000"
            maxLength={4}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="tabular-nums"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="license_plate" className="text-sm font-medium text-stone-800">
            {t("plate")}
          </label>
          <LicensePlateField
            id="license_plate"
            name="license_plate"
            required
            autoComplete="off"
            placeholder="AA 99 XYZ"
            maxLength={10}
            className="placeholder:font-normal"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor={odoDisplayId} className="text-sm font-medium text-stone-800">
          {t("odometer")}
        </label>
        <input type="hidden" name="odometer" value={odoDigits} />
        <Input
          id={odoDisplayId}
          name="odometer_display"
          type="text"
          inputMode="numeric"
          required
          placeholder="100 000"
          value={odoDisplay}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
            setOdoDigits(digits);
          }}
          maxLength={9}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", ".", ",", "-"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          className="tabular-nums"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
