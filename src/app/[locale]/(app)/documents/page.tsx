import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocumentsView } from "@/components/documents/DocumentsView";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePageActor } from "@/lib/auth/actor-page";
import { listDocs } from "@/lib/data/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("documents") };
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "documents");
  const t = await getTranslations("documents");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t(`subtitle.${actor.role}`)} />
      <DocumentsView docs={listDocs(actor)} />
    </>
  );
}
