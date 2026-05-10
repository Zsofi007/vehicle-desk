import { cn } from "@/lib/cn";
import { getVehicleTypeIconSrc, type VehicleType } from "@/lib/vehicle-type";

type Props = {
  type: VehicleType;
  className?: string;
};

export function VehicleTypeIcon({ type, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getVehicleTypeIconSrc(type)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
}
