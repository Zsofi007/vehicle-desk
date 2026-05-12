import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Horizontal scroll for wide `<table>` content. Place inside a rounded
 * `overflow-hidden` shell so borders clip while the inner region scrolls.
 */
export function TableScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {children}
    </div>
  );
}
