"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signIn, type AuthActionState } from "@/lib/actions/auth";
import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";

type Props = {
  locale: AppLocale;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function LoginForm({ locale }: Props) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const te = useTranslations("errors");
  const [state, formAction] = useActionState(
    signIn,
    undefined as AuthActionState | undefined,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />

      {state?.error === "validation" ? (
        <p className="text-sm text-red-800" role="alert">
          {te("validation")}
        </p>
      ) : null}
      {state?.error && state.error !== "validation" ? (
        <p className="text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-800">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium text-stone-800">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 shadow-sm"
        />
      </div>

      <Submit label={t("submitLogin")} />

      <p className="text-center text-sm text-stone-600">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-stone-900 underline underline-offset-2">
          {tNav("signup")}
        </Link>
      </p>
    </form>
  );
}
