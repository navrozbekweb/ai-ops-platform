"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Drawer } from "antd";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/layout";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "./CommandPalette";
import { Header } from "./Header";
import { SidebarContent, type ShellUser } from "./Sidebar";

export function AppShell({
  user,
  initialSidebar,
  children,
}: {
  user: ShellUser;
  initialSidebar: SidebarState;
  children: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useNextRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialSidebar === "collapsed");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/login`);
      router.refresh();
    }
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <a
          href="#main-content"
          className="bg-accent sr-only rounded-lg px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1100]"
        >
          {t("shell.skip")}
        </a>

        <aside
          aria-label={t("common.appName")}
          className={`bg-sidebar sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block ${
            collapsed ? "w-[4.5rem]" : "w-64"
          }`}
        >
          <SidebarContent
            user={user}
            collapsed={collapsed}
            onLogout={logout}
            onToggleCollapsed={toggleCollapsed}
          />
        </aside>

        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          placement="left"
          size={272}
          closable={false}
          styles={{ body: { padding: 0, background: "var(--sidebar)" } }}
          aria-label={t("common.menu")}
        >
          <SidebarContent
            user={user}
            onNavigate={() => setMenuOpen(false)}
            onLogout={logout}
          />
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            user={user}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenSearch={() => setPaletteOpen(true)}
            onLogout={logout}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col gap-6 px-4 py-6 outline-none sm:px-8 sm:py-8"
          >
            {children}
          </main>
        </div>

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          role={user.role}
          onLogout={logout}
        />
      </div>
    </ToastProvider>
  );
}
