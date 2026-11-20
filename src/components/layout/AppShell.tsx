"use client";

import { Suspense, useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Drawer } from "antd";
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { Role, Section } from "@/lib/auth/roles";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const ICONS: Record<Section, ReactNode> = {
  dashboard: <DashboardOutlined />,
  users: <TeamOutlined />,
  roles: <SafetyCertificateOutlined />,
  analytics: <BarChartOutlined />,
  team: <ApartmentOutlined />,
  tasks: <CheckSquareOutlined />,
  approvals: <SafetyCertificateOutlined />,
  documents: <FileTextOutlined />,
  ai: <ThunderboltOutlined />,
  audit: <AuditOutlined />,
  settings: <SettingOutlined />,
  profile: <UserOutlined />,
};

type ShellUser = { name: string; email: string; role: Role; dept: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavList({
  items,
  onNavigate,
}: {
  items: readonly Section[];
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label="Asosiy" className="flex flex-col gap-0.5">
      {items.map((section) => {
        const href = `/${section}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={section}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              active
                ? "bg-sidebar-active text-white"
                : "text-sidebar-text hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {ICONS[section]}
            </span>
            {t(section)}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  user,
  items,
  onNavigate,
  onLogout,
}: {
  user: ShellUser;
  items: readonly Section[];
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex h-full flex-col justify-between gap-6 p-4">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5 px-2">
          <div className="bg-accent flex size-8 items-center justify-center rounded-lg font-bold text-white">
            A
          </div>
          <span className="text-base font-bold text-white">{t("common.appName")}</span>
        </div>
        <div className="bg-sidebar-active mx-1 flex flex-col rounded-lg px-3 py-2.5">
          <span className="text-[11px] font-medium tracking-wider text-blue-200 uppercase">
            {t("roles." + user.role)}
          </span>
          <span className="truncate text-sm font-semibold text-white">{user.dept}</span>
        </div>
        <NavList items={items} onNavigate={onNavigate} />
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-sidebar-text flex min-h-11 items-center gap-3 rounded-lg border-t border-white/10 px-3 text-sm font-medium hover:bg-white/10 hover:text-white"
      >
        <LogoutOutlined aria-hidden="true" />
        {t("common.logout")}
      </button>
    </div>
  );
}

export function AppShell({
  user,
  items,
  children,
}: {
  user: ShellUser;
  items: readonly Section[];
  children: ReactNode;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useNextRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/login`);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarContent user={user} items={items} onLogout={logout} />
      </aside>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="left"
        size={272}
        closable={false}
        styles={{ body: { padding: 0, background: "var(--sidebar)" } }}
        aria-label={t("menu")}
      >
        <SidebarContent
          user={user}
          items={items}
          onNavigate={() => setOpen(false)}
          onLogout={logout}
        />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("menu")}
              className="border-border text-text flex size-11 items-center justify-center rounded-lg border lg:hidden"
            >
              <MenuOutlined />
            </button>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-muted text-xs">{user.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
            <ThemeToggle />
            <div
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
            >
              {initials(user.name)}
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
