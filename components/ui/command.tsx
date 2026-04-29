"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/cn";

export function Command({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex w-full min-h-0 flex-col overflow-hidden",
        // Ensure the list has a bounded height so it can overflow/scroll.
        "h-[min(60vh,24rem)]",
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
      <Search className="h-4 w-4 text-slate-400" />
      <CommandPrimitive.Input
        className={cn(
          "h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain p-1",
        className,
      )}
      {...props}
    />
  );
}

export function CommandEmpty(
  props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      className="px-3 py-6 text-center text-sm text-slate-600"
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none aria-selected:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}

