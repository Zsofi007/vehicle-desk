"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import {
  createExpiryItem,
  type ExpiryActionState,
} from "@/lib/actions/expiry";
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
  vehicleYear?: number;
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

function addUtcYearsYmd(years: number) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function defaultExpiryYmdForType(type: string, vehicleYear?: number) {
  const key = type.trim().toLowerCase();
  const nowYear = new Date().getUTCFullYear();
  const isYoung = typeof vehicleYear === "number" && nowYear - vehicleYear < 10;
  if (key === "itp") return addUtcYearsYmd(isYoung ? 2 : 1);
  return addUtcYearsYmd(1);
}

export function AddExpiryForm({
  vehicleId,
  locale,
  vehicleYear,
  onSuccess,
  onCancel,
}: Props) {
  const t = useTranslations("expiry");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const bound = createExpiryItem.bind(null, vehicleId, locale);
  const [state, formAction] = useActionState(
    bound,
    undefined as ExpiryActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    if (!onSuccess) return;
    queueMicrotask(() => onSuccess());
  }, [onSuccess, state]);

  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<
    "ITP" | "RCA" | "CASCO" | "Vignette" | "Rovinietă" | "Other"
  >("ITP");
  const [customType, setCustomType] = useState("");
  const customId = useId();
  const customRef = useRef<HTMLInputElement | null>(null);
  const [expiryDate, setExpiryDate] = useState(() =>
    defaultExpiryYmdForType("ITP", vehicleYear),
  );

  const isCustom = presetType === "Other";
  const resolvedType = isCustom ? customType.trim() : presetType;

  useEffect(() => {
    if (isCustom) {
      queueMicrotask(() => customRef.current?.focus());
    }
  }, [isCustom]);

  const typeOptions = [
    { value: "ITP" as const, label: t("type_itp"), iconSrc: "/service-icons/better-icons_24.png" },
    { value: "RCA" as const, label: t("type_rca"), iconSrc: "/service-icons/better-icons_19.png" },
    { value: "CASCO" as const, label: t("type_casco"), iconSrc: "/service-icons/better-icons_25.png" },
    { value: "Vignette" as const, label: t("type_vignette"), iconSrc: "/service-icons/better-icons_11.png" },
    { value: "Rovinietă" as const, label: t("type_rovinieta"), iconSrc: "/service-icons/rovinieta.png" },
    { value: "Other" as const, label: t("type_other"), iconSrc: "/service-icons/better-icons_12.png" },
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
        <label htmlFor="e-type" className="text-sm font-medium text-stone-800">
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
                        setExpiryDate(defaultExpiryYmdForType(opt.value, vehicleYear));

                        setOpen(false);
                      }}
                    >
                      <span className="mr-2 inline-flex h-16 w-16 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.iconSrc}
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
          <label htmlFor="e-expiry" className="text-sm font-medium text-stone-800">
            {t("expiryDate")}
          </label>
          <DatePicker
            name="expiry_date"
            value={expiryDate}
            onChange={(ymd) => {
              setExpiryDate(ymd);
            }}
            ariaLabel={t("expiryDate")}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="e-cost" className="text-sm font-medium text-stone-800">
            {t("cost")}{" "}
            <span className="font-normal text-stone-500">({tc("optional")})</span>
          </label>
          <input
            id="e-cost"
            name="cost"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm tabular-nums"
          />
        </div>
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
