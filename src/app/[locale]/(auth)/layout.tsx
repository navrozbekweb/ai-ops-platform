import { setRequestLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SpotlightBackground } from "@/components/auth/SpotlightBackground";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoMark } from "@/components/ui/Logo";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <SpotlightBackground>
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl italic">{t("appName")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <LanguageSwitcher tone="onDark" />
          </Suspense>
          <ThemeToggle tone="onDark" />
        </div>
      </header>
      <main className="relative z-10 flex flex-1 flex-wrap items-center justify-between gap-10 px-5 pt-4 pb-16 sm:px-10 lg:px-16">
        {children}
      </main>
    </SpotlightBackground>
  );
}
