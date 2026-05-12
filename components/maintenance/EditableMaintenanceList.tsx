"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import type { MaintenanceRecord } from "@/types";
import type { MaintenanceTypeKey } from "@/lib/type-keys";
import { getEffectiveMaintenanceIntervalsForVehicle } from "@/lib/actions/maintenance-intervals";
import {
  deleteMaintenanceRecord,
  updateMaintenanceRecord,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";
import { useRouter } from "@/lib/navigation";
import { formatDateYmdUtc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
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
import { DocumentsInline } from "@/components/documents/DocumentsInline";

type Props = {
  vehicleId: string;
  locale: AppLocale;
  records: MaintenanceRecord[];
};

function iconSrc(n: number) {
  return `/maintenance-icons/divided-icons_${String(n).padStart(2, "0")}.png`;
}

function typeMeta(
  t: ReturnType<typeof useTranslations>,
  type: string,
): { label: string; icon: string | null } {
  switch (type) {
    case "OIL_CHANGE":
      return { label: t("type_oil_change"), icon: iconSrc(13) };
    case "FILTERS":
      return { label: t("type_filters"), icon: iconSrc(14) };
    case "BRAKES":
      return { label: t("type_brakes"), icon: iconSrc(10) };
    case "TIRES":
      return { label: t("type_tires"), icon: iconSrc(15) };
    case "BATTERY":
      return { label: t("type_battery"), icon: iconSrc(4) };
    case "TIMING_BELT":
      return { label: t("type_timing_belt"), icon: iconSrc(9) };
    case "OTHER":
      return { label: t("type_other"), icon: iconSrc(4) };
    default:
      return { label: type, icon: iconSrc(4) };
  }
}

function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function formatDueAt(opts: {
  intervalKm: number | null;
  intervalDays: number | null;
  baseOdometer: number;
  baseDate: string;
}) {
  const parts: string[] = [];
  if (typeof opts.intervalKm === "number") {
    parts.push(`${(opts.baseOdometer + opts.intervalKm).toLocaleString()} km`);
  }
  if (typeof opts.intervalDays === "number") {
    parts.push(addDaysYmd(opts.baseDate, opts.intervalDays));
  }
  return parts.join(" · ");
}

function classifyDueStatus(params: {
  currentOdometer: number;
  recordOdometer: number;
  recordDate: string;
  intervalKm: number | null;
  intervalDays: number | null;
  dueSoonKm?: number;
  dueSoonDays?: number;
}): "overdue" | "due_soon" | "ok" | null {
  const dueSoonKm = params.dueSoonKm ?? 1000;
  const dueSoonDays = params.dueSoonDays ?? 14;
  const now = new Date();
  const todayYmd = now.toISOString().slice(0, 10);

  const overdueByKm =
    typeof params.intervalKm === "number" &&
    params.currentOdometer >= params.recordOdometer + params.intervalKm;
  const dueSoonByKm =
    typeof params.intervalKm === "number" &&
    params.currentOdometer >= params.recordOdometer + params.intervalKm - dueSoonKm;

  const dueDate =
    typeof params.intervalDays === "number"
      ? addDaysYmd(params.recordDate, params.intervalDays)
      : null;
  const overdueByTime = dueDate !== null && todayYmd >= dueDate;
  const dueSoonByTime = dueDate !== null && todayYmd >= addDaysYmd(dueDate, -dueSoonDays);

  if (overdueByKm || overdueByTime) return "overdue";
  if (dueSoonByKm || dueSoonByTime) return "due_soon";
  if (params.intervalKm !== null || params.intervalDays !== null) return "ok";
  return null;
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
  intervalsByType,
  currentOdometer,
  refreshIntervals,
}: {
  vehicleId: string;
  locale: AppLocale;
  row: MaintenanceRecord;
  intervalsByType: Map<MaintenanceTypeKey, { interval_km: number | null; interval_days: number | null }>;
  currentOdometer: number;
  refreshIntervals: () => Promise<void>;
}) {
  const router = useRouter();
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tVeh = useTranslations("vehicles");
  const tIntervals = useTranslations("maintenanceIntervals");

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<MaintenanceTypeKey>(
    () => (row.type as MaintenanceTypeKey) ?? "OIL_CHANGE",
  );

  const [date, setDate] = useState(row.date);
  const [odometer, setOdometer] = useState(String(row.odometer));
  const [notes, setNotes] = useState(row.notes ?? "");
  const [intervalKm, setIntervalKm] = useState<string>("");
  const [intervalDays, setIntervalDays] = useState<string>("");

  const effective = intervalsByType.get(presetType) ?? { interval_km: null, interval_days: null };
  const dueAt = effective.interval_km || effective.interval_days
    ? formatDueAt({
        intervalKm: effective.interval_km,
        intervalDays: effective.interval_days,
        baseOdometer: row.odometer,
        baseDate: row.date,
      })
    : "";

  const status = classifyDueStatus({
    currentOdometer,
    recordOdometer: row.odometer,
    recordDate: row.date,
    intervalKm: effective.interval_km,
    intervalDays: effective.interval_days,
  });

  const draftDueAt =
    intervalKm.trim() !== "" || intervalDays.trim() !== ""
      ? formatDueAt({
          intervalKm: intervalKm.trim() === "" ? null : Number(intervalKm),
          intervalDays: intervalDays.trim() === "" ? null : Number(intervalDays),
          baseOdometer: row.odometer,
          baseDate: row.date,
        })
      : dueAt;

  const typeOptions = [
    { value: "OIL_CHANGE" as const, label: t("type_oil_change"), icon: 13 },
    { value: "FILTERS" as const, label: t("type_filters"), icon: 14 },
    { value: "BRAKES" as const, label: t("type_brakes"), icon: 10 },
    { value: "TIRES" as const, label: t("type_tires"), icon: 15 },
    { value: "BATTERY" as const, label: t("type_battery"), icon: 4 },
    { value: "TIMING_BELT" as const, label: t("type_timing_belt"), icon: 9 },
    { value: "OTHER" as const, label: t("type_other"), icon: 4 },
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
      void refreshIntervals();
      router.refresh();
    });
  }, [refreshIntervals, router, state]);

  if (!editing) {
    const meta = typeMeta(t, row.type);
    const rowActionLabel = status === "overdue" ? tc("update") : tc("edit");

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
              variant="secondary"
              size="sm"
              className="gap-1.5"
              aria-label={rowActionLabel}
              onClick={() => {
                setEditing(true);
                setDate(row.date);
                setOdometer(String(row.odometer));
                setNotes(row.notes ?? "");
                setPresetType((row.type as MaintenanceTypeKey) ?? "OIL_CHANGE");
                const eff = intervalsByType.get((row.type as MaintenanceTypeKey) ?? "OIL_CHANGE");
                setIntervalKm(eff?.interval_km ? String(eff.interval_km) : "");
                setIntervalDays(eff?.interval_days ? String(eff.interval_days) : "");
              }}
            >
              <Pencil className="h-4 w-4 shrink-0" aria-hidden />
              <span>{rowActionLabel}</span>
            </Button>
          </div>
        </div>

        <p className="mt-1 text-sm text-stone-600 tabular-nums">
          {t("odometer")}: {row.odometer.toLocaleString(locale)} km
        </p>

        {draftDueAt ? (
          <p className="mt-1 text-sm text-stone-600">
            {tIntervals("dueAt")}: <span className="tabular-nums">{draftDueAt}</span>
            {status ? (
              <span
                className={cn(
                  "ml-2 inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
                  status === "overdue"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : status === "due_soon"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-emerald-200 bg-emerald-50 text-emerald-900",
                )}
              >
                {status === "overdue"
                  ? tIntervals("status_overdue")
                  : status === "due_soon"
                    ? tIntervals("status_due_soon")
                    : tIntervals("status_ok")}
              </span>
            ) : null}
          </p>
        ) : null}

        {row.notes ? <p className="mt-2 text-sm text-stone-700">{row.notes}</p> : null}

        <div className="mt-3">
          <DocumentsInline locale={locale} kind="maintenance" parentId={row.id} />
        </div>

        <div className="mt-3 flex justify-end">
          <ConfirmDeleteDialog
            description={tVeh("deleteConfirm")}
            trigger={
              <Button type="button" variant="destructive" size="sm" aria-label={tc("delete")}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {tc("delete")}
              </Button>
            }
            onConfirm={async () => {
              await deleteMaintenanceRecord(vehicleId, row.id, locale);
              router.refresh();
            }}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="px-4 py-4">
      <form action={formAction} className="grid gap-3">
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
          <label className="text-sm font-medium text-stone-800">{t("type")}</label>
          <input type="hidden" name="type" value={presetType} />

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary" className="w-full justify-between">
                <span className="truncate">
                  {typeOptions.find((o) => o.value === presetType)?.label ?? tc("none")}
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
                          setPresetType(opt.value as MaintenanceTypeKey);
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
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-800">{t("date")}</label>
            <DatePicker name="date" value={date} onChange={setDate} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-800">{t("odometer")}</label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              name="odometer"
              value={odometer}
              onChange={(e) => setOdometer(e.currentTarget.value)}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-stone-800">{t("notes")}</label>
          <Input type="text" name="notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
          <p className="text-sm font-medium text-stone-900">{tIntervals("vehicleTitle")}</p>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-stone-800">{tIntervals("intervalKm")}</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  name="interval_km"
                  value={intervalKm}
                  onChange={(e) => setIntervalKm(e.currentTarget.value)}
                  className="tabular-nums"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-stone-800">{tIntervals("intervalDays")}</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  name="interval_days"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.currentTarget.value)}
                  className="tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
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
  const [intervalsByType, setIntervalsByType] = useState<
    Map<MaintenanceTypeKey, { interval_km: number | null; interval_days: number | null }>
  >(new Map());
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const loaded = useRef(false);

  const refreshIntervals = useCallback(async () => {
    const res = await getEffectiveMaintenanceIntervalsForVehicle(vehicleId);
    if ("error" in res) return;
    setCurrentOdometer(res.currentOdometer ?? 0);
    const m = new Map<
      MaintenanceTypeKey,
      { interval_km: number | null; interval_days: number | null }
    >();
    for (const row of res.intervals) {
      m.set(row.type, { interval_km: row.interval_km, interval_days: row.interval_days });
    }
    setIntervalsByType(m);
  }, [vehicleId]);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void refreshIntervals();
  }, [refreshIntervals]);

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
        <MaintenanceRow
          key={row.id}
          vehicleId={vehicleId}
          locale={locale}
          row={row}
          intervalsByType={intervalsByType}
          currentOdometer={currentOdometer}
          refreshIntervals={refreshIntervals}
        />
      ))}
    </ul>
  );
}

