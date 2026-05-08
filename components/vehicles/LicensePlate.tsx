import { cn } from "@/lib/cn";

type Props = {
  value: string;
  className?: string;
  size?: "sm" | "md";
  strip?: "normal" | "narrow";
};

export function LicensePlate({
  value,
  className,
  size = "md",
  strip = "normal",
}: Props) {
  const plate = value.trim().toUpperCase();
  const isSm = size === "sm";
  const isNarrow = strip === "narrow";

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-xl border-2 border-stone-900 bg-white shadow-sm",
        isSm ? "h-8" : "h-11",
        className,
      )}
      aria-label={plate}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-[#0b49b5] px-2",
          isSm ? (isNarrow ? "w-8" : "w-10") : isNarrow ? "w-10" : "w-12",
        )}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eu-stars.png"
          alt=""
          aria-hidden
          className={cn(isSm ? "h-6 w-6" : "h-7 w-7", "object-contain")}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center justify-center px-4 font-semibold uppercase tracking-[0.18em] text-stone-900",
          isSm ? "text-sm" : "text-base",
        )}
      >
        <span className="truncate">{plate}</span>
      </div>
    </div>
  );
}

