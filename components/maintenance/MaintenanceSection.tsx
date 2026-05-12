"use client";

import { useId, useState } from "react";
import { Plus, Wrench } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { MaintenanceRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { AddMaintenanceForm } from "@/components/maintenance/AddMaintenanceForm";
import { EditableMaintenanceList } from "@/components/maintenance/EditableMaintenanceList";
import { ReadOnlyMaintenanceList } from "@/components/maintenance/ReadOnlyMaintenanceList";

type Props = {
  title: string;
  addLabel: string;
  vehicleId: string;
  locale: AppLocale;
  records: MaintenanceRecord[];
  currentOdometer?: number | null;
  readOnly?: boolean;
};

export function MaintenanceSection({
  title,
  addLabel,
  vehicleId,
  locale,
  records,
  currentOdometer,
  readOnly = false,
}: Props) {
  const [adding, setAdding] = useState(false);
  const headingId = useId();

  if (readOnly) {
    return (
      <section aria-labelledby={headingId} className="space-y-4">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-lg font-semibold text-stone-900"
        >
          <Wrench className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
          <span>{title}</span>
        </h2>
        <ReadOnlyMaintenanceList locale={locale} records={records} />
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-lg font-semibold text-stone-900"
        >
          <Wrench className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
          <span>{title}</span>
        </h2>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!adding) setAdding(true);
          }}
          disabled={adding}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {addLabel}
        </Button>
      </div>

      {adding ? (
        <AddMaintenanceForm
          vehicleId={vehicleId}
          locale={locale}
          initialOdometer={currentOdometer}
          onSuccess={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      <EditableMaintenanceList vehicleId={vehicleId} locale={locale} records={records} />
    </section>
  );
}

