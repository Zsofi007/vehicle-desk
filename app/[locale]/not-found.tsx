import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-stone-900">{t("notFound")}</h1>
    </div>
  );
}
