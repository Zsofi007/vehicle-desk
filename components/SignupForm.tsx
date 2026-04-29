"use client";

import { useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AppLocale } from "@/lib/i18n";
import { Link, useRouter } from "@/lib/navigation";
import { useTranslations } from "next-intl";

type Props = {
  locale: AppLocale;
};

function Submit({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function SignupForm({ locale }: Props) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const te = useTranslations("errors");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const confirmHintId = useId();
  const reqHintId = useId();
  const [error, setError] = useState<string | null>(null);

  const passwordMeetsRequirements = useMemo(
    () => password.length >= 8 && /\d/.test(password),
    [password],
  );
  const passwordsMatch = useMemo(
    () => confirmPassword.length === 0 || password === confirmPassword,
    [password, confirmPassword],
  );

  return (
    <form
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "");
        const pwd = String(fd.get("password") ?? "");
        const token = String(fd.get("inviteToken") ?? "");

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pwd, token }),
        });

        if (!res.ok) {
          setError(te("validation"));
          return;
        }

        router.push("/dashboard", { locale });
      }}
    >
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="su-email" className="text-sm font-medium text-stone-800">
          {t("email")}
        </label>
        <input
          id="su-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="su-invite" className="text-sm font-medium text-stone-800">
          {t("inviteToken")}
        </label>
        <input
          id="su-invite"
          name="inviteToken"
          type="text"
          autoComplete="off"
          required
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
          value={inviteToken}
          onChange={(e) => setInviteToken(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="su-password" className="text-sm font-medium text-stone-800">
          {t("password")}
        </label>
        <input
          id="su-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby={reqHintId}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p id={reqHintId} className="text-xs text-stone-600">
          {t("passwordRequirements")}
        </p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="su-confirm-password"
          className="text-sm font-medium text-stone-800"
        >
          {t("confirmPassword")}
        </label>
        <input
          id="su-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby={confirmHintId}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {!passwordsMatch ? (
          <p id={confirmHintId} className="text-xs text-red-800" role="alert">
            {t("passwordMismatch")}
          </p>
        ) : (
          <p id={confirmHintId} className="text-xs text-stone-600">
            {t("passwordMismatchHint")}
          </p>
        )}
      </div>

      <Submit
        label={t("submitSignup")}
        disabled={!passwordMeetsRequirements || !passwordsMatch}
      />

      <p className="text-center text-sm text-stone-600">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-stone-900 underline underline-offset-2">
          {tNav("login")}
        </Link>
      </p>
    </form>
  );
}
