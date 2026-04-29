"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import {
  createMaintenanceRecord,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";
import type { AppLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

type Props = {
  vehicleId: string;
  locale: AppLocale;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");

  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {t("submit")}
    </button>
  );
}

export function AddMaintenanceForm({ vehicleId, locale, onSuccess, onCancel }: Props) {
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const bound = createMaintenanceRecord.bind(null, vehicleId, locale);
  const [state, formAction] = useActionState(
    bound,
    undefined as MaintenanceActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    if (!onSuccess) return;
    queueMicrotask(() => onSuccess());
  }, [onSuccess, state]);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<
    "Oil" | "Filters" | "Engine parts" | "Brakes" | "Tyres" | "Other" | ""
  >("Oil");
  const [customType, setCustomType] = useState("");
  const customId = useId();
  const customRef = useRef<HTMLInputElement | null>(null);

  const isCustom = presetType === "Other";
  const resolvedType = isCustom ? customType.trim() : presetType;

  useEffect(() => {
    if (isCustom) {
      queueMicrotask(() => customRef.current?.focus());
    }
  }, [isCustom]);

  const typeOptions = [
    { value: "Oil" as const, label: t("type_oil"), icon: 13 },
    { value: "Filters" as const, label: t("type_filters"), icon: 14 },
    { value: "Engine parts" as const, label: t("type_engine_parts"), icon: 9 },
    { value: "Brakes" as const, label: t("type_brakes"), icon: 10 },
    { value: "Tyres" as const, label: t("type_tyres"), icon: 15 },
    { value: "Other" as const, label: t("type_other"), icon: 4 },
  ];

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-base font-semibold text-stone-900">{t("addTitle")}</h3>

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
        <label htmlFor="m-type" className="text-sm font-medium text-stone-800">
          {t("type")}
        </label>
        <input type="hidden" name="type" value={resolvedType} />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="secondary" className="w-full justify-between">
              <span className={cn("truncate", !resolvedType && "text-slate-500")}>
                {resolvedType
                  ? typeOptions.find((o) => o.value === presetType)?.label ?? resolvedType
                  : tc("none")}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput placeholder={t("type")} />
              <CommandList>
                <CommandEmpty>{tc("none")}</CommandEmpty>
                <CommandGroup>
                  {typeOptions.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        setPresetType(opt.value);
                        if (opt.value !== "Other") setCustomType("");
                        setOpen(false);
                      }}
                    >
                      <span className="mr-2 inline-flex h-16 w-16 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/maintenance-icons/divided-icons_${String(opt.icon).padStart(2, "0")}.png`}
                          alt=""
                          aria-hidden
                          className="h-16 w-16 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {presetType === opt.value ? (
                        <Check className="h-4 w-4 text-slate-700" aria-hidden />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isCustom ? (
          <div className="grid gap-2">
            <label htmlFor={customId} className="text-sm font-medium text-stone-800">
              {tc("custom")}
            </label>
            <input
              id={customId}
              ref={customRef}
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              required
              autoComplete="off"
              className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
            />
          </div>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <label htmlFor="m-date" className="text-sm font-medium text-stone-800">
            {t("date")}
          </label>
          <DatePicker
            name="date"
            value={date}
            onChange={(ymd) => setDate(ymd)}
            ariaLabel={t("date")}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="m-odo" className="text-sm font-medium text-stone-800">
            {t("odometer")}
          </label>
          <input
            id="m-odo"
            name="odometer"
            type="number"
            inputMode="numeric"
            required
            min={0}
            step={1}
            pattern="[0-9]*"
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm tabular-nums"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="m-notes" className="text-sm font-medium text-stone-800">
          {t("notes")}{" "}
          <span className="font-normal text-stone-500">({tc("optional")})</span>
        </label>
        <textarea
          id="m-notes"
          name="notes"
          rows={3}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {typeof onCancel === "function" ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {tc("cancel")}
          </Button>
        ) : null}
        <SubmitButton />
      </div>
    </form>
  );
}
