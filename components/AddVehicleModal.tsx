"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import { AddVehicleForm } from "@/components/AddVehicleForm";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  locale: AppLocale;
  triggerLabel: string;
  title: string;
  description?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  triggerIcon?: React.ReactNode;
};

export function AddVehicleModal({
  locale,
  triggerLabel,
  title,
  description,
  triggerVariant,
  triggerSize,
  triggerClassName,
  triggerIcon,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          aria-label={triggerSize === "icon" ? triggerLabel : undefined}
        >
          {triggerIcon ?? <Plus className="h-4 w-4" aria-hidden />}
          {triggerSize === "icon" ? null : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bottom-0 top-auto left-0 right-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-xl rounded-b-none p-4 md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-[calc(100vw-2rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:p-6"
        style={open ? { animation: "vehicle-drawer-in 180ms ease-out" } : undefined}
        {...(!description && { "aria-describedby": undefined })}
      >
        <div className="flex max-h-[90vh] flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible overscroll-contain pt-2 pb-6 pl-1 pr-1">
          <AddVehicleForm
            locale={locale}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

