"use client";

import { useTranslations } from "next-intl";

import { usePathname } from "@/lib/navigation";

type Props = {
  fallback: string;
};

export function TopNavTitle({ fallback }: Props) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  if (pathname === "/dashboard") return <>{tNav("dashboard")}</>;
  if (pathname === "/vehicles" || pathname.startsWith("/vehicles/"))
    return <>{tNav("vehicles")}</>;
  if (pathname === "/settings") return <>{tNav("settings")}</>;
  if (pathname === "/admin/invites") return <>{tNav("admin")}</>;

  return <>{fallback}</>;
}

