import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSection } from "@/lib/auth/roles";
import { requirePageActor } from "@/lib/auth/actor-page";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  if (!isSection(section)) notFound();

  // Rol bo'yicha ikkinchi tekshiruv (proxy'dan tashqari), rol ombordan olinadi.
  await requirePageActor(locale, section);

  const t = await getTranslations();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t(`nav.${section}`)}</h1>
      <div className="border-border bg-surface rounded-xl border p-6">
        <p className="text-muted mb-2 text-sm">{t("placeholder.access")}</p>
        <p>{t("placeholder.text")}</p>
      </div>
    </>
  );
}
