import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TasksView } from "@/components/tasks/TasksView";
import { requirePageActor } from "@/lib/auth/actor-page";
import { assignablePeople, listTasks, todayIso } from "@/lib/data/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("tasks") };
}

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "tasks");
  const t = await getTranslations("tasks");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t(`subtitle.${actor.role}`)} />
      <TasksView
        tasks={listTasks(actor)}
        assignees={assignablePeople(actor).map(({ id, name }) => ({ id, name }))}
        role={actor.role}
        today={todayIso()}
      />
    </>
  );
}
