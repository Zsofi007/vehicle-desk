"use client";

import { Trash2 } from "lucide-react";

import { deleteVehicle } from "@/lib/actions/vehicles";
import type { AppLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

type Props = {
  vehicleId: string;
  locale: AppLocale;
  confirmLabel: string;
  deleteLabel: string;
};

export function DeleteVehicleButton({
  vehicleId,
  locale,
  confirmLabel,
  deleteLabel,
}: Props) {
  return (
    <ConfirmDeleteDialog
      description={confirmLabel}
      trigger={
        <Button type="button" variant="destructive" size="sm" aria-label={deleteLabel}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {deleteLabel}
        </Button>
      }
      onConfirm={async () => {
        await deleteVehicle(vehicleId, locale);
      }}
    />
  );
}
