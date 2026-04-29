"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { Vehicle } from "@/types";
import { Input } from "@/components/ui/input";
import { VehicleTile } from "@/components/VehicleTile";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddVehicleModal } from "@/components/AddVehicleModal";

type VehicleStatus = "expired" | "soon" | "ok";

export type VehicleTileRow = {
  vehicle: Vehicle;
  status: VehicleStatus;
  statusLabel: string;
  statusClassName: string;
};

type Props = {
  locale: AppLocale;
  rows: VehicleTileRow[];
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
  filterAll: string;
  filterOk: string;
  filterSoon: string;
  filterExpired: string;
  sortLabel: string;
  sortPlate: string;
  sortMake: string;
  sortYear: string;
  sortStatus: string;
  addVehicleLabel: string;
  addVehicleDescription: string;
};

type SortKey = "plate" | "make" | "year" | "status";

function statusRank(s: VehicleStatus) {
  if (s === "expired") return 0;
  if (s === "soon") return 1;
  return 2;
}

export function VehiclesBrowser({
  locale,
  rows,
  searchLabel,
  searchPlaceholder,
  filterLabel,
  filterAll,
  filterOk,
  filterSoon,
  filterExpired,
  sortLabel,
  sortPlate,
  sortMake,
  sortYear,
  sortStatus,
  addVehicleLabel,
  addVehicleDescription,
}: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("plate");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ vehicle, status }) => {
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${vehicle.license_plate} ${vehicle.make} ${vehicle.model} ${vehicle.year}`
        .toLowerCase()
        .replace(/\s+/g, " ");
      return hay.includes(q);
    });
  }, [rows, query, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "plate") {
        return a.vehicle.license_plate.localeCompare(b.vehicle.license_plate);
      }
      if (sortKey === "make") {
        const am = `${a.vehicle.make} ${a.vehicle.model}`;
        const bm = `${b.vehicle.make} ${b.vehicle.model}`;
        return am.localeCompare(bm);
      }
      if (sortKey === "year") {
        return b.vehicle.year - a.vehicle.year;
      }
      // status
      return statusRank(a.status) - statusRank(b.status);
    });
    return arr;
  }, [filtered, sortKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/service-icons/better-icons_21.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-1 top-1/2 h-10 w-10 -translate-y-1/2 opacity-70"
              loading="lazy"
              decoding="async"
            />
          <Input
            aria-label={searchLabel}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-12"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={sortLabel}
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <ArrowUpDown className="h-4 w-4" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            {(
              [
                { key: "plate" as const, label: sortPlate },
                { key: "make" as const, label: sortMake },
                { key: "year" as const, label: sortYear },
                { key: "status" as const, label: sortStatus },
              ] as const
            ).map((opt) => {
              const active = sortKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortKey(opt.key)}
                  className={[
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600",
                    active ? "bg-slate-900 text-white" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="text-left">{opt.label}</span>
                  {active ? <span aria-hidden>✓</span> : null}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div
            role="group"
            aria-label={filterLabel}
            className="-mx-1 flex items-center gap-1 overflow-x-auto overscroll-x-contain px-1 py-0.5"
          >
            {(
              [
                { key: "all" as const, label: filterAll },
                { key: "ok" as const, label: filterOk },
                { key: "soon" as const, label: filterSoon },
                { key: "expired" as const, label: filterExpired },
              ] as const
            ).map((opt) => {
              const active = statusFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(opt.key)}
                  className={[
                    "shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600",
                    active
                      ? "border-slate-300 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {sorted.length} / {rows.length}
        </div>
        <div className="hidden md:block">
          <AddVehicleModal
            locale={locale}
            triggerLabel={addVehicleLabel}
            title={addVehicleLabel}
            description={addVehicleDescription}
            triggerVariant="accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 [@media(min-width:1100px)]:grid-cols-3 xl:grid-cols-4">
        {sorted.map(({ vehicle, statusLabel, statusClassName }) => (
          <VehicleTile
            key={vehicle.id}
            locale={locale}
            vehicleId={vehicle.id}
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            licensePlate={vehicle.license_plate}
            statusLabel={statusLabel}
            statusClassName={statusClassName}
          />
        ))}
      </div>
    </div>
  );
}

