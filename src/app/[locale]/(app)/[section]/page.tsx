import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { HOME_SECTION, canAccess, isSection } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  if (!isSection(section)) notFound();

  const session = await getSession();
  if (!session) redirect({ href: "/login", locale });
  // Rol bo'yicha ikkinchi tekshiruv (proxy'dan tashqari).
  if (!canAccess(session!.role, section)) redirect({ href: `/${HOME_SECTION}`, locale });

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
