"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { addYears, format as formatDate } from "date-fns";

import type { AppLocale } from "@/lib/i18n";
import type { ExpiryItem } from "@/types";
import {
  deleteExpiryItem,
  updateExpiryItem,
  type ExpiryActionState,
} from "@/lib/actions/expiry";
import { useRouter } from "@/lib/navigation";
import { formatDateYmdUtc } from "@/lib/format";
import {
  addUtcDays,
  formatUtcDateString,
  getExpiryStatus,
  utcTodayString,
} from "@/lib/dates";
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
  vehicleYear?: number;
  items: ExpiryItem[];
};

function addYearsYmd(years: number) {
  return formatDate(addYears(new Date(), years), "yyyy-MM-dd");
}

function defaultExpiryYmdForType(type: string, vehicleYear?: number) {
  const key = type.trim().toLowerCase();
  const nowYear = new Date().getUTCFullYear();
  const isYoung = typeof vehicleYear === "number" && nowYear - vehicleYear < 10;
  if (key === "itp") return addYearsYmd(isYoung ? 2 : 1);
  return addYearsYmd(1);
}

function deriveExpiryType(raw: string): {
  presetType: "ITP" | "RCA" | "CASCO" | "Vignette" | "Rovinietă" | "Other";
  customType: string;
} {
  const key = raw.trim().toLowerCase();
  if (key === "itp") return { presetType: "ITP", customType: "" };
  if (key === "rca") return { presetType: "RCA", customType: "" };
  if (key === "casco") return { presetType: "CASCO", customType: "" };
  if (key === "vignette" || key === "vigneta" || key === "vignetă")
    return { presetType: "Vignette", customType: "" };
  if (key === "rovinietă" || key === "rovinieta")
    return { presetType: "Rovinietă", customType: "" };
  if (key === "other") return { presetType: "Other", customType: "" };
  return { presetType: "Other", customType: raw };
}

function expiryTypeMeta(t: ReturnType<typeof useTranslations>, type: string): { label: string; iconSrc?: string } {
  const key = type.trim().toLowerCase();
  if (key === "itp") return { label: t("type_itp"), iconSrc: "/service-icons/better-icons_24.png" };
  if (key === "rca") return { label: t("type_rca"), iconSrc: "/service-icons/better-icons_19.png" };
  if (key === "casco") return { label: t("type_casco"), iconSrc: "/service-icons/better-icons_25.png" };
  if (key === "vignette" || key === "vignetă" || key === "vigneta")
    return { label: t("type_vignette"), iconSrc: "/service-icons/better-icons_11.png" };
  if (key === "rovinietă" || key === "rovinieta")
    return { label: t("type_rovinieta"), iconSrc: "/service-icons/rovinieta.png" };
  if (key === "other") return { label: t("type_other"), iconSrc: "/service-icons/better-icons_12.png" };
  return { label: type, iconSrc: "/service-icons/better-icons_12.png" };
}

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return <Button type="submit" disabled={pending}>{t("save")}</Button>;
}

function ExpiryRow({
  vehicleId,
  locale,
  row,
  vehicleYear,
}: {
  vehicleId: string;
  locale: AppLocale;
  row: ExpiryItem;
  vehicleYear?: number;
}) {
  const router = useRouter();
  const t = useTranslations("expiry");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tVeh = useTranslations("vehicles");
  const tStatus = useTranslations("status");
  const tAria = useTranslations("aria");

  const today = utcTodayString();
  const soonEnd = formatUtcDateString(addUtcDays(new Date(), 7));
  const status = getExpiryStatus(row.expiry_date, today, soonEnd);
  const statusLabel =
    status === "expired"
      ? tStatus("badgeExpired")
      : status === "expiring_soon"
        ? tStatus("badgeSoon")
        : tStatus("badgeOk");
  const tone =
    status === "expired"
      ? "border-red-200 bg-red-50 text-red-900"
      : status === "expiring_soon"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-stone-200 bg-stone-50 text-stone-800";

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState(() => deriveExpiryType(row.type).presetType);
  const [customType, setCustomType] = useState(() => deriveExpiryType(row.type).customType);
  const customId = useId();
  const customRef = useRef<HTMLInputElement | null>(null);

  const [expiryDate, setExpiryDate] = useState(row.expiry_date);
  const [cost, setCost] = useState(row.cost === null || row.cost === undefined ? "" : String(row.cost));

  const isCustom = presetType === "Other";
  const resolvedType = isCustom ? customType.trim() : presetType;

  useEffect(() => {
    if (isCustom) queueMicrotask(() => customRef.current?.focus());
  }, [isCustom]);

  const typeOptions = [
    { value: "ITP" as const, label: t("type_itp"), iconSrc: "/service-icons/better-icons_24.png" },
    { value: "RCA" as const, label: t("type_rca"), iconSrc: "/service-icons/better-icons_19.png" },
    { value: "CASCO" as const, label: t("type_casco"), iconSrc: "/service-icons/better-icons_25.png" },
    { value: "Vignette" as const, label: t("type_vignette"), iconSrc: "/service-icons/better-icons_11.png" },
    { value: "Rovinietă" as const, label: t("type_rovinieta"), iconSrc: "/service-icons/rovinieta.png" },
    { value: "Other" as const, label: t("type_other"), iconSrc: "/service-icons/better-icons_12.png" },
  ];

  const bound = updateExpiryItem.bind(null, vehicleId, row.id, locale);
  const [state, formAction] = useActionState(
    bound,
    undefined as ExpiryActionState | undefined,
  );

  useEffect(() => {
    if (!state || state.error) return;
    queueMicrotask(() => {
      setEditing(false);
      router.refresh();
    });
  }, [router, state]);

  const meta = expiryTypeMeta(t, row.type);

  if (!editing) {
    return (
      <li className="px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-col">
          <p className="flex min-w-0 items-center gap-2 font-medium text-stone-900">
            {meta.iconSrc ? (
              <span className="inline-flex h-12 w-12 items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.iconSrc}
                  alt=""
                  aria-hidden
                  className="h-16 w-16 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ) : null}
            <span className="min-w-0 truncate">{meta.label}</span>
          </p>
          <time dateTime={row.expiry_date} className="text-sm text-stone-600 tabular-nums">
              {formatDateYmdUtc(row.expiry_date, locale)}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={tVeh("edit")}
              onClick={() => {
                setEditing(true);
                setExpiryDate(row.expiry_date);
                setCost(row.cost === null || row.cost === undefined ? "" : String(row.cost));
                {
                  const derived = deriveExpiryType(row.type);
                  setPresetType(derived.presetType);
                  setCustomType(derived.customType);
                }
              }}
              className="h-9 w-9 shrink-0"
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
                  className="h-9 w-9 shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              }
              onConfirm={async () => {
                await deleteExpiryItem(vehicleId, row.id, locale);
                router.refresh();
              }}
            />
          </div>
        </div>
        <div className="mt-2">
            <p className={`inline-flex max-w-full rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}>
              <span className="sr-only">{tAria("expiryStatus")}: </span>
              {statusLabel}
            </p>
        </div>
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
                          setExpiryDate(defaultExpiryYmdForType(opt.value, vehicleYear));
                          setOpen(false);
                        }}
                      >
                        <span className="mr-2 inline-flex h-12 w-12 items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={opt.iconSrc}
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
            <label className="text-sm font-medium text-stone-800">{t("expiryDate")}</label>
            <DatePicker
              name="expiry_date"
              value={expiryDate}
              onChange={(ymd) => setExpiryDate(ymd)}
              ariaLabel={t("expiryDate")}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-800">
              {t("cost")} <span className="font-normal text-stone-500">({tc("optional")})</span>
            </label>
            <Input
              name="cost"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setEditing(false);
              setExpiryDate(row.expiry_date);
              setCost(row.cost === null || row.cost === undefined ? "" : String(row.cost));
              {
                const derived = deriveExpiryType(row.type);
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

export function EditableExpiryList({ vehicleId, locale, vehicleYear, items }: Props) {
  const t = useTranslations("expiry");

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {items.map((row) => (
        <ExpiryRow
          key={row.id}
          vehicleId={vehicleId}
          locale={locale}
          vehicleYear={vehicleYear}
          row={row}
        />
      ))}
    </ul>
  );
}

