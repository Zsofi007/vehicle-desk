"use client";

import { useMemo, useState } from "react";
import { parseISO, isValid, format } from "date-fns";
import { hu, ro, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  value: string; // yyyy-mm-dd
  onChange: (ymd: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  emptyLabel?: string;
  className?: string;
};

function ymdToDate(ymd: string) {
  const d = parseISO(ymd);
  return isValid(d) ? d : undefined;
}

function localeForDayPicker(appLocale: string) {
  if (appLocale.startsWith("hu")) return hu;
  if (appLocale.startsWith("ro")) return ro;
  return enUS;
}

export function DatePicker({
  name,
  value,
  onChange,
  disabled,
  ariaLabel,
  emptyLabel,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const dfLocale = localeForDayPicker(locale);

  const selected = useMemo(() => ymdToDate(value), [value]);

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            data-empty={!selected}
            className={cn(
              "h-11 w-full justify-between rounded-xl text-left font-normal data-[empty=true]:text-slate-500",
              className,
            )}
            aria-label={ariaLabel ?? "Choose date"}
          >
            {selected ? (
              <span className="truncate">{format(selected, "PPP", { locale: dfLocale })}</span>
            ) : (
              <span className="truncate">{emptyLabel ?? "Pick a date"}</span>
            )}
            <CalendarIcon className="h-4 w-4 text-slate-600" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-h-none overflow-visible p-0"
          align="start"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }}
            disabled={disabled}
            locale={dfLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

