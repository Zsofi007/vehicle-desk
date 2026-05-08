"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { updateVehicleOdometerOnly, type VehicleActionState } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/lib/navigation";

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return (
    <Button type="submit" disabled={pending}>
      {t("save")}
    </Button>
  );
}

export function QuickOdometerForm(props: {
  locale: AppLocale;
  vehicleId: string;
  initialOdometer: number;
}) {
  const router = useRouter();
  const t = useTranslations("vehicles");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const odoId = useId();

  const [odo, setOdo] = useState(String(props.initialOdometer));
  const bound = updateVehicleOdometerOnly.bind(null, props.locale, props.vehicleId);
  const [state, formAction] = useActionState(
    bound,
    undefined as VehicleActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    queueMicrotask(() => {
      router.refresh();
    });
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-base font-semibold text-stone-900">
        {t("quickOdometerTitle")}
      </h1>

      {state?.error === "validation" ? (
        <p className="text-sm text-red-800" role="alert">
          {te("validation")}
        </p>
      ) : null}
      {state?.error && state.error !== "validation" ? (
        <p className="text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor={odoId} className="text-sm font-medium text-stone-800">
          {t("odometer")}
        </label>
        <Input
          id={odoId}
          name="odometer"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={odo}
          onChange={(e) => setOdo(e.currentTarget.value.replace(/\D/g, "").slice(0, 7))}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
          }}
          className="tabular-nums"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {tc("back")}
        </Button>
        <SaveButton />
      </div>
    </form>
  );
}

