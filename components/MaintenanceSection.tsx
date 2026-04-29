"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { MaintenanceRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { AddMaintenanceForm } from "@/components/AddMaintenanceForm";
import { EditableMaintenanceList } from "@/components/EditableMaintenanceList";

type Props = {
  title: string;
  addLabel: string;
  vehicleId: string;
  locale: AppLocale;
  records: MaintenanceRecord[];
};

export function MaintenanceSection({
  title,
  addLabel,
  vehicleId,
  locale,
  records,
}: Props) {
  const [adding, setAdding] = useState(false);
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold text-stone-900">
          {title}
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
          onSuccess={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      <EditableMaintenanceList vehicleId={vehicleId} locale={locale} records={records} />
    </section>
  );
}

