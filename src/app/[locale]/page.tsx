import { redirect } from "@/i18n/navigation";
import { HOME_SECTION } from "@/lib/auth/roles";

export default async function LocaleRoot({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Sessiya bo'lmasa proxy keyingi qadamda login'ga yo'naltiradi.
  redirect({ href: `/${HOME_SECTION}`, locale });
}
