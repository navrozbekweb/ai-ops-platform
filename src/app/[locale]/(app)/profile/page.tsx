import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileView } from "@/components/profile/ProfileView";
import { requirePageActor } from "@/lib/auth/actor-page";
import { managerNameOf } from "@/lib/data/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("profile") };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "profile");
  const t = await getTranslations("profile");
  const tRoles = await getTranslations("roles");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ProfileView
        profile={{
          name: actor.name,
          email: actor.email,
          roleLabel: tRoles(actor.role),
          dept: actor.dept,
          managerName: managerNameOf(actor),
        }}
      />
    </>
  );
}
