import { getPreferredLocaleForUser, getSessionUser } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n";
import { redirect } from "@/lib/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as AppLocale;
  const user = await getSessionUser();

  if (user) {
    const preferred = await getPreferredLocaleForUser(user.id);
    redirect({ href: "/dashboard", locale: preferred ?? locale });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-4 pt-[max(3rem,env(safe-area-inset-top,0px))] pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
