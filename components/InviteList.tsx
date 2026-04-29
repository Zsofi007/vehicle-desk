"use client";

import type { AppLocale } from "@/lib/i18n";

export type InviteListItem = {
  id: string;
  email: string;
  used: boolean;
  expires_at: string;
  created_at: string;
};

function status(inv: InviteListItem) {
  if (inv.used) return "Used";
  if (new Date(inv.expires_at).getTime() < Date.now()) return "Expired";
  return "Pending";
}

export function InviteList({
  locale,
  invites,
}: {
  locale: AppLocale;
  invites: InviteListItem[];
}) {
  if (invites.length === 0) {
    return <p className="mt-3 text-sm text-stone-600">No invites.</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-stone-600">
            <th className="px-2 py-1 font-medium">Email</th>
            <th className="px-2 py-1 font-medium">Status</th>
            <th className="px-2 py-1 font-medium">Expires</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => (
            <tr key={inv.id} className="rounded-md bg-stone-50">
              <td className="px-2 py-2 text-stone-900">{inv.email}</td>
              <td className="px-2 py-2 text-stone-900">{status(inv)}</td>
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

