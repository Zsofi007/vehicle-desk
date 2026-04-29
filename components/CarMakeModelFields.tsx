"use client";

import { useMemo, useState } from "react";
import { getMakes, getModels } from "car-info";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { getCarLogoSrc } from "@/lib/car-logos";

type Option = {
  value: string;
  label: string;
  // Logo/icon slot (used for make logos).
  icon?: React.ReactNode;
};

function MakeLogo({ make }: { make: string }) {
  const [hidden, setHidden] = useState(false);
  const src = getCarLogoSrc(make);
  if (!src || hidden) return null;

  return (
    // Intentionally using <img> here: this list can render many items,
    // and missing logos would spam Next Image optimizer errors in dev.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      style={{ height: "56px", width: "auto" }}
      className="object-contain"
      onError={() => setHidden(true)}
    />
  );
}

function groupByFirstLetter(options: Option[]) {
  const groups = new Map<string, Option[]>();
  for (const opt of options) {
    const letter = (opt.label.trim()[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    const arr = groups.get(key) ?? [];
    arr.push(opt);
    groups.set(key, arr);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function normalizeLabel(v: string) {
  return v.trim();
}

type Props = {
  makeName?: string;
  modelName?: string;
  initialMake?: string;
  initialModel?: string;
};

export function CarMakeModelFields({
  makeName = "make",
  modelName = "model",
  initialMake = "",
  initialModel = "",
}: Props) {
  const makeOptions = useMemo<Option[]>(
    () =>
      (getMakes() as string[])
        .map((m) => ({
          value: m,
          label: m,
          icon: <MakeLogo make={m} />,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const makeGroups = useMemo(() => groupByFirstLetter(makeOptions), [makeOptions]);

  const [makeOpen, setMakeOpen] = useState(false);
  const knownMake = makeOptions.some((o) => o.value === initialMake);
  const [make, setMake] = useState(knownMake ? initialMake : "");
  const [customMake, setCustomMake] = useState(knownMake ? "" : initialMake);
  const [makeIsCustom, setMakeIsCustom] = useState(!knownMake && initialMake.length > 0);

  const resolvedMake = makeIsCustom ? normalizeLabel(customMake) : make;

  const modelOptions = useMemo<Option[]>(() => {
    if (!resolvedMake) return [];
    return (getModels(resolvedMake) as string[])
      .map((m) => ({ value: m, label: m }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [resolvedMake]);

  const modelGroups = useMemo(() => groupByFirstLetter(modelOptions), [modelOptions]);

  const [modelOpen, setModelOpen] = useState(false);
  const knownModel = initialModel
    ? modelOptions.some((o) => o.value === initialModel)
    : false;
  const [model, setModel] = useState(knownModel ? initialModel : "");
  const [customModel, setCustomModel] = useState(knownModel ? "" : initialModel);
  const [modelIsCustom, setModelIsCustom] =
    useState(!knownModel && initialModel.length > 0);

  const resolvedModel = modelIsCustom ? normalizeLabel(customModel) : model;

  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <label htmlFor="make" className="mb-1 text-sm font-medium text-stone-800">
          Make
        </label>

        <input type="hidden" name={makeName} value={resolvedMake} />

        <div className="grid sm:grid-cols-[1fr_auto] sm:items-start">
          <Popover open={makeOpen} onOpenChange={setMakeOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-between"
              >
                <span className={cn("truncate", !resolvedMake && "text-slate-500")}>
                  {resolvedMake || "Select make…"}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Search make…" />
                <CommandList>
                  <CommandEmpty>No make found.</CommandEmpty>
                  <CommandGroup heading="Custom">
                    <CommandItem
                      onSelect={() => {
                        setMakeIsCustom(true);
                        setMake("");
                        setMakeOpen(false);
                      }}
                    >
                      <span className="flex-1">Use custom make…</span>
                    </CommandItem>
                  </CommandGroup>
                  {makeGroups.map(([letter, opts]) => (
                    <CommandGroup key={letter} heading={letter}>
                      {opts.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => {
                            setMakeIsCustom(false);
                            setCustomMake("");
                            setMake(opt.value);
                            setModel("");
                            setCustomModel("");
                            setModelIsCustom(false);
                            setMakeOpen(false);
                          }}
                        >
                          <span className="mr-2 inline-flex h-14 w-16 items-center justify-center">
                            {opt.icon ?? null}
                          </span>
                          <span className="flex-1">{opt.label}</span>
                          {make === opt.value && !makeIsCustom ? (
                            <Check className="h-4 w-4 text-slate-700" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMakeIsCustom(true);
              setMake("");
              setModel("");
              setCustomModel("");
              setModelIsCustom(false);
              setMakeOpen(false);
            }}
            className="justify-start text-slate-600"
          >
            Custom
          </Button>
        </div>

        {makeIsCustom ? (
          <Input
            id="make"
            value={customMake}
            onChange={(e) => setCustomMake(e.target.value)}
            placeholder="Enter make"
            autoComplete="off"
            required
          />
        ) : null}
      </div>

      <div className="grid gap-1">
        <label htmlFor="model" className="mb-1 text-sm font-medium text-stone-800">
          Model
        </label>

        <input type="hidden" name={modelName} value={resolvedModel} />

        <div className="grid sm:grid-cols-[1fr_auto] sm:items-start">
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-between"
                disabled={!resolvedMake}
              >
                <span className={cn("truncate", !resolvedModel && "text-slate-500")}>
                  {resolvedModel || (resolvedMake ? "Select model…" : "Select make first")}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Search model…" />
                <CommandList>
                  <CommandEmpty>No model found.</CommandEmpty>
                  <CommandGroup heading="Custom">
                    <CommandItem
                      onSelect={() => {
                        setModelIsCustom(true);
                        setModel("");
                        setModelOpen(false);
                      }}
                    >
                      <span className="flex-1">Use custom model…</span>
                    </CommandItem>
                  </CommandGroup>
                  {modelGroups.map(([letter, opts]) => (
                    <CommandGroup key={letter} heading={letter}>
                      {opts.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => {
                            setModelIsCustom(false);
                            setCustomModel("");
                            setModel(opt.value);
                            setModelOpen(false);
                          }}
                        >
                          <span className="mr-2 inline-flex w-6 items-center justify-center">
                            {opt.icon ?? null}
                          </span>
                          <span className="flex-1">{opt.label}</span>
                          {model === opt.value && !modelIsCustom ? (
                            <Check className="h-4 w-4 text-slate-700" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setModelIsCustom(true);
              setModel("");
              setModelOpen(false);
            }}
            className="justify-start text-slate-600"
            disabled={!resolvedMake}
          >
            Custom
          </Button>
        </div>

        {modelIsCustom ? (
          <Input
            id="model"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="Enter model"
            autoComplete="off"
            required
          />
        ) : null}
      </div>
    </div>
  );
}

