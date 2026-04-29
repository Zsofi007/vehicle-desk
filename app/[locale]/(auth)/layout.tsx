import { getSessionUser } from "@/lib/auth";
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
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
