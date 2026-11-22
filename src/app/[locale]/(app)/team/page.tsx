import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamView } from "@/components/team/TeamView";
import { requirePageActor } from "@/lib/auth/actor-page";
import { teamOf, teamRows, todayIso } from "@/lib/data/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("team") };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "team");
  const t = await getTranslations("team");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <TeamView
        rows={teamRows(actor)}
        assignees={teamOf(actor).map(({ id, name }) => ({ id, name }))}
        today={todayIso()}
      />
    </>
  );
}
