"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import type { MaintenanceRecord } from "@/types";
import {
  deleteMaintenanceRecord,
  updateMaintenanceRecord,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";
import { useRouter } from "@/lib/navigation";
import { formatDateYmdUtc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
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
  records: MaintenanceRecord[];
};

function iconSrc(n: number) {
  return `/maintenance-icons/divided-icons_${String(n).padStart(2, "0")}.png`;
}

function normalizeType(raw: string) {
  return raw.trim().toLowerCase();
}

function deriveMaintenanceType(raw: string): {
  presetType: "Oil" | "Filters" | "Engine parts" | "Brakes" | "Tyres" | "Other" | "";
  customType: string;
} {
  const key = normalizeType(raw);
  if (key === "oil" || key === "oil & filters" || key === "oil and filters") {
    return { presetType: "Oil", customType: "" };
  }
  if (key === "filters" || key === "filter") {
    return { presetType: "Filters", customType: "" };
  }
  if (key === "engine parts" || key === "engine components") {
    return { presetType: "Engine parts", customType: "" };
  }
  if (key === "brakes") {
    return { presetType: "Brakes", customType: "" };
  }
  if (key === "tyres" || key === "tires" || key === "tire") {
    return { presetType: "Tyres", customType: "" };
  }
  if (key === "other") {
    return { presetType: "Other", customType: "" };
  }
  return { presetType: "Other", customType: raw };
}

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return <Button type="submit" disabled={pending}>{t("save")}</Button>;
}

function MaintenanceRow({
  vehicleId,
  locale,
  row,
}: {
  vehicleId: string;
  locale: AppLocale;
  row: MaintenanceRecord;
}) {
  const router = useRouter();
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tVeh = useTranslations("vehicles");

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState(() => deriveMaintenanceType(row.type).presetType);
  const [customType, setCustomType] = useState(() => deriveMaintenanceType(row.type).customType);
  const customId = useId();
  const customRef = useRef<HTMLInputElement | null>(null);

  const [date, setDate] = useState(row.date);
  const [odometer, setOdometer] = useState(String(row.odometer));
  const [notes, setNotes] = useState(row.notes ?? "");

  const isCustom = presetType === "Other";
  const resolvedType = isCustom ? customType.trim() : presetType;

  useEffect(() => {
    if (isCustom) queueMicrotask(() => customRef.current?.focus());
  }, [isCustom]);

  const typeOptions = [
    { value: "Oil" as const, label: t("type_oil"), icon: 13 },
    { value: "Filters" as const, label: t("type_filters"), icon: 14 },
    { value: "Engine parts" as const, label: t("type_engine_parts"), icon: 9 },
    { value: "Brakes" as const, label: t("type_brakes"), icon: 10 },
    { value: "Tyres" as const, label: t("type_tyres"), icon: 15 },
    { value: "Other" as const, label: t("type_other"), icon: 4 },
  ];

  const bound = updateMaintenanceRecord.bind(null, vehicleId, row.id, locale);
  const [state, formAction] = useActionState(
    bound,
    undefined as MaintenanceActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    queueMicrotask(() => {
      setEditing(false);
      router.refresh();
    });
  }, [router, state]);

  if (!editing) {
    const meta = (() => {
      const key = normalizeType(row.type);
      if (key === "oil" || key === "oil & filters" || key === "oil and filters") {
        return { label: t("type_oil"), icon: iconSrc(13) };
      }
      if (key === "filters" || key === "filter") {
        return { label: t("type_filters"), icon: iconSrc(14) };
      }
      if (key === "engine parts" || key === "engine components") {
        return { label: t("type_engine_parts"), icon: iconSrc(9) };
      }
      if (key === "brakes") return { label: t("type_brakes"), icon: iconSrc(10) };
      if (key === "tyres" || key === "tires" || key === "tire") {
        return { label: t("type_tyres"), icon: iconSrc(15) };
      }
      if (key === "other") return { label: t("type_other"), icon: iconSrc(4) };
      return { label: row.type, icon: iconSrc(4) };
    })();

    return (
      <li className="px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="flex items-center gap-2 font-medium text-stone-900">
            {meta.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meta.icon}
                alt=""
                aria-hidden
                className="h-12 w-12 object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <span>{meta.label}</span>
          </p>
          <div className="flex items-center gap-2">
            <time dateTime={row.date} className="text-sm text-stone-600 tabular-nums">
              {formatDateYmdUtc(row.date, locale)}
            </time>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={tVeh("edit")}
              onClick={() => {
                setEditing(true);
                setDate(row.date);
                setOdometer(String(row.odometer));
                setNotes(row.notes ?? "");
                {
                  const derived = deriveMaintenanceType(row.type);
                  setPresetType(derived.presetType);
                  setCustomType(derived.customType);
                }
              }}
              className="h-9 w-9"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
            <ConfirmDeleteDialog
              trigger={
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  aria-label={tc("delete")}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              }
              onConfirm={async () => {
                await deleteMaintenanceRecord(vehicleId, row.id, locale);
                router.refresh();
              }}
            />
          </div>
        </div>
        <p className="mt-1 text-sm text-stone-600 tabular-nums">
          {t("odometer")}: {row.odometer.toLocaleString(locale)} km
        </p>
        {row.notes ? <p className="mt-2 text-sm text-stone-700">{row.notes}</p> : null}
      </li>
    );
  }

  return (
    <li className="px-4 py-4">
      <form action={formAction} className="grid gap-3">
        {state?.error === "validation" ? (
          <p className="text-sm text-red-800" role="alert">{te("validation")}</p>
        ) : null}
        {state?.error && state.error !== "validation" ? (
          <p className="text-sm text-red-800" role="alert">{state.error}</p>
        ) : null}

        <div className="grid gap-2">
          <label className="text-sm font-medium text-stone-800">{t("type")}</label>
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
                        <span className="mr-2 inline-flex h-12 w-12 items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={iconSrc(opt.icon)}
                            alt=""
                            aria-hidden
                            className="h-12 w-12 object-contain"
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
            <label className="text-sm font-medium text-stone-800">{t("date")}</label>
            <DatePicker
              name="date"
              value={date}
              onChange={(ymd) => setDate(ymd)}
              ariaLabel={t("date")}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-800">{t("odometer")}</label>
            <Input
              name="odometer"
              type="number"
              inputMode="numeric"
              required
              min={0}
              step={1}
              pattern="[0-9]*"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value.replace(/\D/g, "").slice(0, 7))}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
              }}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-stone-800">
            {t("notes")} <span className="font-normal text-stone-500">({tc("optional")})</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setEditing(false);
              setDate(row.date);
              setOdometer(String(row.odometer));
              setNotes(row.notes ?? "");
              {
                const derived = deriveMaintenanceType(row.type);
                setPresetType(derived.presetType);
                setCustomType(derived.customType);
              }
            }}
          >
            {tc("cancel")}
          </Button>
          <SaveButton />
        </div>
      </form>
    </li>
  );
}

export function EditableMaintenanceList({ vehicleId, locale, records }: Props) {
  const t = useTranslations("maintenance");

  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {records.map((row) => (
        <MaintenanceRow key={row.id} vehicleId={vehicleId} locale={locale} row={row} />
      ))}
    </ul>
  );
}

