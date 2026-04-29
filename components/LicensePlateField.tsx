"use client";

import { cn } from "@/lib/cn";
import { Input, type InputProps } from "@/components/ui/input";

type Props = InputProps & {
  stripClassName?: string;
};

export function LicensePlateField({ className, stripClassName, ...props }: Props) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1 top-1 bottom-1 w-12 rounded-lg bg-[#0b49b5]",
          stripClassName,
        )}
      />
      <Input
        {...props}
        className={cn(
          "h-11 rounded-xl border-2 border-stone-900 pl-16 font-semibold uppercase tracking-[0.18em] shadow-sm placeholder:tracking-normal",
          className,
        )}
      />
    </div>
  );
}

