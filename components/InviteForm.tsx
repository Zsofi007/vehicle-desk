"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  emailLabel: string;
  buttonLabel: string;
  tokenLabel: string;
  copiedLabel: string;
};

export function InviteForm({
  emailLabel,
  buttonLabel,
  tokenLabel,
  copiedLabel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            body: JSON.stringify({ email }),
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

