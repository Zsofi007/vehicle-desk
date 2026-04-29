"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/lib/i18n";
import { useRouter } from "@/lib/navigation";
import { getCarLogoSrc } from "@/lib/car-logos";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "@/components/LicensePlate";

type Props = {
  locale: AppLocale;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  statusLabel: string;
  statusClassName: string;
};

export function VehicleTile({
  locale,
  vehicleId,
  make,
  model,
  year,
  licensePlate,
  statusLabel,
  statusClassName,
}: Props) {
  const router = useRouter();
  const t = useTranslations("vehicles");
  const [hideLogo, setHideLogo] = useState(false);
  const logoSrc = getCarLogoSrc(make);

  const href = `/vehicles/${vehicleId}`;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${licensePlate} ${make} ${model}`}
      onClick={() => router.push(href, { locale })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href, { locale });
        }
      }}
      className="group relative flex w-full min-w-0 min-h-42 cursor-pointer items-start overflow-hidden rounded-xl border border-slate-200 bg-white pt-6 pb-2 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:ring-1 hover:ring-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
    >
      <span
        className={[
          "absolute right-2 top-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
          statusClassName,
        ].join(" ")}
      >
        {statusLabel}
      </span>

      <div className="flex h-28 w-28 items-center justify-center rounded-sm">
        {logoSrc && !hideLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="object-contain w-full h-full"
            onError={() => setHideLogo(true)}
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-slate-200" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 pr-4 pt-4 flex flex-col">
        <div className="mt-0.5 truncate text-sm text-slate-600 mr-2">
          {make} {model}
          <span className="text-slate-400"> · </span>
          <span className="tabular-nums">{year}</span>
        </div>
        <div className="min-w-0">
          <LicensePlate value={licensePlate} size="md" strip="narrow" className="max-w-full" />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("openVehicleAriaLabel")}
          onClick={(e) => {
            e.stopPropagation();
            router.push(href, { locale });
          }}
          className="absolute bottom-2 right-2 h-10 w-auto pr-1 pl-1 rounded-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/car-key-2.png"
            alt=""
            className="h-7 w-7 transition-transform duration-200 group-hover:rotate-[-10deg]"
          />
          <p>{t("open")}</p>
        </Button>
      </div>

    </div>
  );
}

