import { getPreferredLocaleForUser, getSessionUser } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n";
import { redirect } from "@/lib/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const user = await getSessionUser();

  if (user) {
    const preferred = await getPreferredLocaleForUser(user.id);
    redirect({ href: "/dashboard", locale: preferred ?? locale });
  }

  redirect({ href: "/login", locale });
}
