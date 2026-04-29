"use client";

import { useState } from "react";

import { getCarLogoSrc } from "@/lib/car-logos";

type Props = {
  make: string;
  className?: string;
};

export function VehicleMakeLogo({ make, className }: Props) {
  const [hidden, setHidden] = useState(false);
  const logoSrc = getCarLogoSrc(make);
  if (!logoSrc || hidden) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      // style={{ height: "40px", width: "auto" }}
      className={className ?? "object-contain"}
      onError={() => setHidden(true)}
    />
  );
}

