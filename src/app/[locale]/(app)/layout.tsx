import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NAV_BY_ROLE } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Proxy asosiy himoya, bu esa ikkinchi qatlam: sessiyasiz hech narsa render qilinmaydi.
  const session = await getSession();
  if (!session) redirect({ href: "/login", locale });
  const user = session!;

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role, dept: user.dept }}
      items={NAV_BY_ROLE[user.role]}
    >
      {children}
    </AppShell>
  );
}
