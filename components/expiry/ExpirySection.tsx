"use client";

import { useId, useState } from "react";
import { Clock, Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { ExpiryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { AddExpiryForm } from "./AddExpiryForm";
import { EditableExpiryList } from "./EditableExpiryList";
import { ReadOnlyExpiryList } from "./ReadOnlyExpiryList";

type Props = {
  title: string;
  addLabel: string;
  vehicleId: string;
  locale: AppLocale;
  vehicleYear?: number;
  items: ExpiryItem[];
  readOnly?: boolean;
  statusReferenceYmd?: string;
};

export function ExpirySection({
  title,
  addLabel,
  vehicleId,
  locale,
  vehicleYear,
  items,
  readOnly = false,
  statusReferenceYmd,
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
          <Clock className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
          <span>{title}</span>
        </h2>
        <ReadOnlyExpiryList
          locale={locale}
          items={items}
          statusReferenceYmd={statusReferenceYmd}
        />
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
          <Clock className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
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
        <AddExpiryForm
          vehicleId={vehicleId}
          locale={locale}
          vehicleYear={vehicleYear}
          onSuccess={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      <EditableExpiryList
        vehicleId={vehicleId}
        locale={locale}
        vehicleYear={vehicleYear}
        items={items}
      />
    </section>
  );
}

