import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm, type DemoAccount } from "@/components/auth/LoginForm";
import { DEMO_ACCOUNTS, isMockAuthEnabled } from "@/lib/mock/users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("title") };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");

  // Demo hisoblar bloki faqat SHOW_DEMO_ACCOUNTS=true bo'lganda ko'rinadi (dizaynda ko'rinmasligi uchun sukut bo'yicha yashirin).
  const demoAccounts: DemoAccount[] | null =
    isMockAuthEnabled() && process.env.SHOW_DEMO_ACCOUNTS === "true"
      ? DEMO_ACCOUNTS.map(({ role, email, password }) => ({ role, email, password }))
      : null;

  return (
    <>
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
        <p className="font-display text-5xl leading-[0.98] tracking-[-0.04em] italic sm:text-7xl">
          {t("headlineA")}
        </p>
        <p className="-mt-4 text-5xl leading-[0.98] tracking-[-0.06em] sm:text-7xl">
          {t("headlineB")}
        </p>
        <p className="max-w-xs leading-relaxed text-white/85">{t("lead")}</p>
      </div>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        <Suspense fallback={null}>
          <LoginForm demoAccounts={demoAccounts} />
        </Suspense>
      </AuthCard>
    </>
  );
}
