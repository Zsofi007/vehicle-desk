"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { utcTodayString } from "@/lib/dates";
import type { AppLocale } from "@/lib/i18n";

export type InviteListItem = {
  id: string;
  email: string;
  used: boolean;
  expires_at: string;
  created_at: string;
};

export function InviteList({
  locale,
  invites,
}: {
  locale: AppLocale;
  invites: InviteListItem[];
}) {
  const t = useTranslations("admin");
  const [todayYmd] = useState(() => utcTodayString());

  function statusLabel(inv: InviteListItem) {
    if (inv.used) return t("inviteStatusUsed");
    const expYmd = inv.expires_at.slice(0, 10);
    if (expYmd.localeCompare(todayYmd) < 0) return t("inviteStatusExpired");
    return t("inviteStatusPending");
  }

  if (invites.length === 0) {
    return <p className="mt-3 text-sm text-stone-600">{t("emptyInvites")}</p>;
  }

  return (
    <div className="mt-3 -mx-4 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0">
      <table className="min-w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-stone-600">
            <th className="px-2 py-1 font-medium">{t("inviteColumnEmail")}</th>
            <th className="px-2 py-1 font-medium">{t("inviteColumnStatus")}</th>
            <th className="px-2 py-1 font-medium">{t("inviteColumnExpires")}</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => (
            <tr key={inv.id} className="rounded-md bg-stone-50">
              <td className="px-2 py-2 text-stone-900">{inv.email}</td>
              <td className="px-2 py-2 text-stone-900">{statusLabel(inv)}</td>
              <td className="px-2 py-2 text-stone-700">
                {new Date(inv.expires_at).toLocaleString(locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
