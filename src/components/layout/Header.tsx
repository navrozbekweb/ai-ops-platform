"use client";

import { useTranslations } from "next-intl";
import { MenuOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileMenu } from "./ProfileMenu";
import type { ShellUser } from "./Sidebar";

export function Header({
  user,
  onOpenMenu,
  onOpenSearch,
  onLogout,
}: {
  user: ShellUser;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="border-border bg-surface sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t("common.menu")}
          className="border-border text-text hover:bg-surface-2 flex size-11 shrink-0 items-center justify-center rounded-lg border lg:hidden"
        >
          <MenuOutlined aria-hidden="true" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label={t("shell.search")}
          aria-keyshortcuts="Control+K Meta+K"
          className="border-border text-muted hover:bg-surface-2 flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm md:w-56"
        >
          <SearchOutlined aria-hidden="true" />
          <span className="hidden flex-1 text-left md:inline">{t("shell.search")}</span>
          <kbd className="border-border hidden rounded border px-1.5 py-0.5 text-[11px] font-semibold md:inline">
            Ctrl K
          </kbd>
        </button>
        <NotificationsMenu role={user.role} />
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
