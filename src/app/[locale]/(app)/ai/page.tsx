import { getTranslations, setRequestLocale } from "next-intl/server";
import { AiChat } from "@/components/ai/AiChat";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageActor } from "@/lib/auth/actor-page";
import { getSettings } from "@/lib/data/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("ai") };
}

export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageActor(locale, "ai");
  const t = await getTranslations("ai");
  const enabled = getSettings().aiEnabled;

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {enabled ? (
        <AiChat />
      ) : (
        <div className="border-border bg-surface rounded-xl border">
          <EmptyState title={t("disabled.title")} text={t("disabled.text")} />
        </div>
      )}
    </>
  );
}
