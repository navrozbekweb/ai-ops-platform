import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApprovalsView } from "@/components/tasks/ApprovalsView";
import { requirePageActor } from "@/lib/auth/actor-page";
import { listTasks, todayIso } from "@/lib/data/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("approvals") };
}

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "approvals");
  const t = await getTranslations("approvals");
  const pending = listTasks(actor).filter(
    (task) => task.status === "review" && task.can.manage,
  );

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ApprovalsView tasks={pending} today={todayIso()} />
    </>
  );
}
