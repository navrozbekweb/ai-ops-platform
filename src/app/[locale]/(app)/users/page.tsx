import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsersView } from "@/components/users/UsersView";
import { requirePageActor } from "@/lib/auth/actor-page";
import { listPeople } from "@/lib/data/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("users") };
}

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "users");
  const result = listPeople(actor);
  // Rol ombordan tekshirildi; admin bo'lmasa bu yerga yetib kelmaydi.
  const people = result.ok ? result.value : [];
  const t = await getTranslations("users");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <UsersView people={people} currentUserId={actor.id} />
    </>
  );
}
