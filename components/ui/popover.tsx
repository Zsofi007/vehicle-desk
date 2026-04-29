"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      onWheelCapture={(e) => {
        e.stopPropagation();
        props.onWheelCapture?.(e);
      }}
      onTouchMoveCapture={(e) => {
        e.stopPropagation();
        props.onTouchMoveCapture?.(e);
      }}
      className={cn(
        "z-50 w-72 max-h-[min(60vh,24rem)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl outline-none",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

