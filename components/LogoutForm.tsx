import { signOut } from "@/lib/actions/auth";
import type { AppLocale } from "@/lib/i18n";
import { LogOut } from "lucide-react";

type Props = {
  locale: AppLocale;
  label: string;
};

export function LogoutForm({ locale, label }: Props) {
  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {label}
      </button>
    </form>
  );
}
