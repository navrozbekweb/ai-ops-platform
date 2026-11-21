"use client";

import { useTranslations } from "next-intl";
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_GROUPS_BY_ROLE, type Role } from "@/lib/auth/roles";
import { NavIcon } from "./nav-icons";

export type ShellUser = { name: string; email: string; role: Role; dept: string };

const itemBase =
  "flex min-h-11 items-center rounded-lg text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300";

export function SidebarContent({
  user,
  collapsed = false,
  onNavigate,
  onLogout,
  onToggleCollapsed,
}: {
  user: ShellUser;
  collapsed?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  /** Faqat kompyuter ko'rinishida beriladi; telefondagi yon panelda tugma yo'q. */
  onToggleCollapsed?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const groups = NAV_GROUPS_BY_ROLE[user.role];
  const pad = collapsed ? "justify-center px-0" : "gap-3 px-3";

  return (
    <div className="flex h-full flex-col justify-between gap-6 p-3">
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto">
        <div
          className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : "px-2"}`}
        >
          <div className="bg-accent flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-white">
            A
          </div>
          {collapsed ? null : (
            <span className="text-base font-bold text-white">{t("common.appName")}</span>
          )}
        </div>

        {collapsed ? null : (
          <div className="bg-sidebar-active mx-1 flex flex-col rounded-lg px-3 py-2.5">
            <span className="text-[11px] font-medium tracking-wider text-blue-200 uppercase">
              {t(`roles.${user.role}`)}
            </span>
            <span className="truncate text-sm font-semibold text-white">{user.dept}</span>
          </div>
        )}

        <nav aria-label={t("shell.mainNav")} className="flex flex-col gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              role="group"
              aria-labelledby={`nav-group-${group.id}`}
              className={`flex flex-col gap-0.5 ${collapsed ? "border-t border-white/10 pt-3 first:border-0 first:pt-0" : ""}`}
            >
              <p
                id={`nav-group-${group.id}`}
                className={
                  collapsed
                    ? "sr-only"
                    : "px-3 pb-1 text-[11px] font-semibold tracking-wider text-blue-200/80 uppercase"
                }
              >
                {t(`navGroups.${group.id}`)}
              </p>
              {group.items.map((section) => {
                const href = `/${section}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                const label = t(`nav.${section}`);
                return (
                  <Link
                    key={section}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? label : undefined}
                    title={collapsed ? label : undefined}
                    className={`${itemBase} ${pad} ${
                      active
                        ? "bg-sidebar-active text-white"
                        : "text-sidebar-text hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <NavIcon section={section} />
                    {collapsed ? null : label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-white/10 pt-3">
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
            title={collapsed ? t("shell.expand") : t("shell.collapse")}
            className={`${itemBase} ${pad} text-sidebar-text hover:bg-white/10 hover:text-white`}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            {collapsed ? null : t("shell.collapse")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          aria-label={collapsed ? t("common.logout") : undefined}
          title={collapsed ? t("common.logout") : undefined}
          className={`${itemBase} ${pad} text-sidebar-text hover:bg-white/10 hover:text-white`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            <LogoutOutlined />
          </span>
          {collapsed ? null : t("common.logout")}
        </button>
      </div>
    </div>
  );
}
