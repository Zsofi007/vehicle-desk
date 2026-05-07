"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { GB, HU, RO } from "country-flag-icons/react/3x2";

import { cn } from "@/lib/cn";

type Props = {
  emailLabel: string;
  languageLabel: string;
  buttonLabel: string;
  tokenLabel: string;
  copiedLabel: string;
};

export function InviteForm({
  emailLabel,
  languageLabel,
  buttonLabel,
  tokenLabel,
  copiedLabel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [lang, setLang] = useState<"en" | "hu" | "ro">("en");
  const [langOpen, setLangOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localeFlag: Record<"en" | "hu" | "ro", React.ComponentType<{ className?: string }>> =
    {
      en: GB,
      hu: HU,
      ro: RO,
    };
  const ActiveFlag = localeFlag[lang];

  return (
    <form
      className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setCopied(false);
        setToken(null);

        startTransition(async () => {
          const res = await fetch("/api/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, lang }),
          });

          const data = (await res.json().catch(() => null)) as
            | { token?: string }
            | null;

          if (!res.ok || !data?.token) {
            setError("Forbidden.");
            return;
          }

          setToken(data.token);
          setEmail("");
          router.refresh();
        });
      }}
    >
      <div className="grid w-full gap-2 sm:max-w-sm">
        <label htmlFor="invite-email" className="text-sm font-medium text-stone-800">
          {emailLabel}
        </label>
        <input
          id="invite-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          autoComplete="email"
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
        />
      </div>

      <div className="grid w-full gap-2 sm:max-w-[12rem]">
        <label className="text-sm font-medium text-stone-800">
          {languageLabel}
        </label>
        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((v) => !v)}
            onBlur={(e) => {
              const nextFocused = e.relatedTarget as Node | null;
              if (
                nextFocused &&
                e.currentTarget.parentElement?.contains(nextFocused)
              ) {
                return;
              }
              setLangOpen(false);
            }}
            className="flex h-[42px] w-full items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ActiveFlag className="h-3.5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
              <span className="truncate text-sm">
                {lang === "en" ? "English" : lang === "hu" ? "Magyar" : "Română"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-stone-500" aria-hidden />
          </button>

          {langOpen ? (
            <div
              role="menu"
              aria-label={languageLabel}
              className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg"
            >
              {(
                [
                  { value: "en" as const, label: "English", Flag: GB },
                  { value: "hu" as const, label: "Magyar", Flag: HU },
                  { value: "ro" as const, label: "Română", Flag: RO },
                ] as const
              ).map(({ value, label, Flag }) => {
                const isActive = value === lang;
                return (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                      isActive
                        ? "bg-stone-50 text-stone-900"
                        : "text-stone-700 hover:bg-stone-50",
                    )}
                    onClick={() => {
                      setLang(value);
                      setLangOpen(false);
                    }}
                  >
                    <Flag className="h-3.5 w-5 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                    <span className="flex-1">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {buttonLabel}
      </button>

      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {token ? (
        <div className="grid w-full gap-2 sm:col-span-2 sm:mt-3">
          <label className="text-sm font-medium text-stone-800">{tokenLabel}</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={token}
              className="w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-900"
            />
            <button
              type="button"
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-60"
              onClick={async () => {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              Copy
            </button>
            {copied ? <span className="text-sm text-stone-600">{copiedLabel}</span> : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}

