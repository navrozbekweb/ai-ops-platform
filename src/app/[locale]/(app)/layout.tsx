import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/layout/AppShell";
import { requirePageActor } from "@/lib/auth/actor-page";
import { SIDEBAR_COOKIE, parseSidebarState } from "@/lib/layout";

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
  const user = await requirePageActor(locale);

  const initialSidebar = parseSidebarState((await cookies()).get(SIDEBAR_COOKIE)?.value);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role, dept: user.dept }}
      initialSidebar={initialSidebar}
    >
      {children}
    </AppShell>
  );
}
