import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuditView } from "@/components/audit/AuditView";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePageActor } from "@/lib/auth/actor-page";
import { HOME_SECTION } from "@/lib/auth/roles";
import { listAudit } from "@/lib/data/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("audit") };
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "audit");
  const result = listAudit(actor);
  if (!result.ok) redirect(`/${locale}/${HOME_SECTION}`);
  const t = await getTranslations("audit");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AuditView entries={result.value} />
    </>
  );
}
