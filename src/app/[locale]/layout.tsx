import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource-variable/inter";
import "@fontsource/playfair-display/500-italic.css";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/components/providers/AppProviders";
import { THEME_COOKIE, parseThemePreference } from "@/lib/theme";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: { default: t("appName"), template: `%s | ${t("appName")}` },
    description: t("tagline"),
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1015" },
  ],
};

// "system" tanlovida sahifa yuklanishidan oldin sinfni o'rnatadi (miltillashning oldini oladi).
const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);var p=m?m[1]:'system';if(p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const cookie = (await cookies()).get(THEME_COOKIE)?.value;
  const initialPreference = parseThemePreference(cookie);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={initialPreference === "dark" ? "dark" : undefined}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <AppProviders initialPreference={initialPreference}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
