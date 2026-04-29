"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import type { ExpiryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { AddExpiryForm } from "@/components/AddExpiryForm";
import { EditableExpiryList } from "@/components/EditableExpiryList";

type Props = {
  title: string;
  addLabel: string;
  vehicleId: string;
  locale: AppLocale;
  vehicleYear?: number;
  items: ExpiryItem[];
};

export function ExpirySection({
  title,
  addLabel,
  vehicleId,
  locale,
  vehicleYear,
  items,
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

