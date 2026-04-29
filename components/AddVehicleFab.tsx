"use client";

import { Plus } from "lucide-react";

import type { AppLocale } from "@/lib/i18n";
import { usePathname } from "@/lib/navigation";
import { AddVehicleModal } from "@/components/AddVehicleModal";

type Props = {
  locale: AppLocale;
  label: string;
  title: string;
  description?: string;
};

export function AddVehicleFab({ locale, label, title, description }: Props) {
  const pathname = usePathname();
  const showFab = pathname === "/dashboard" || pathname === "/vehicles";
  if (!showFab) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 md:hidden">
      <AddVehicleModal
        locale={locale}
        triggerLabel={label}
        title={title}
        description={description}
        triggerVariant="accent"
        triggerSize="icon"
        triggerClassName="h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
        triggerIcon={<Plus className="h-6 w-6" aria-hidden />}
      />
    </div>
  );
}

