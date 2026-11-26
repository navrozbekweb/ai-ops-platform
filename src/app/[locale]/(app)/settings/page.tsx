import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { requirePageActor } from "@/lib/auth/actor-page";
import { getSettings } from "@/lib/data/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("settings") };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageActor(locale, "settings");
  const t = await getTranslations("settings");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsForm settings={getSettings()} />
    </>
  );
}
