"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton, type Locale } from "react-day-picker";

import { cn } from "@/lib/cn";
import { Button, buttonVariants } from "@/components/ui/button";

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  locale?: Partial<Locale>;
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-white p-3",
        className,
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code ?? "default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon" }),
          "h-9 w-9 rounded-lg p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon" }),
          "h-9 w-9 rounded-lg p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-9",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-slate-200 bg-white shadow-sm",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-slate-500",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-[0.8rem] font-normal text-slate-500 select-none text-center",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day,
        ),
        range_start: cn("rounded-l-md bg-slate-100", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-slate-100", defaultClassNames.range_end),
        today: cn(
          "rounded-md bg-slate-100 text-slate-900 data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-slate-400 aria-selected:text-slate-400",
          defaultClassNames.outside,
        ),
        disabled: cn("text-slate-300 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
            );
          }
          return (
            <ChevronDownIcon className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
          );
        },
        DayButton: ({ ...dayProps }) => <CalendarDayButton locale={locale} {...dayProps} />,
        ...components,
      }}
      {...props}
    />
  );
}

export function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square size-auto w-full min-w-9 flex-col gap-1 leading-none font-normal data-[range-end=true]:rounded-md data-[range-end=true]:bg-slate-900 data-[range-end=true]:text-white data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-slate-100 data-[range-middle=true]:text-slate-900 data-[range-start=true]:rounded-md data-[range-start=true]:bg-slate-900 data-[range-start=true]:text-white data-[selected-single=true]:bg-slate-900 data-[selected-single=true]:text-white [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

