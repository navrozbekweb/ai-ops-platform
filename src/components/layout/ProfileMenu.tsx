"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { DownOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "@/i18n/navigation";
import { Popover } from "@/components/ui/Popover";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { initials } from "./nav-icons";
import type { ShellUser } from "./Sidebar";

export function ProfileMenu({
  user,
  onLogout,
}: {
  user: ShellUser;
  onLogout: () => void;
}) {
  const t = useTranslations();

  return (
    <Popover
      label={t("shell.account")}
      triggerClassName="border-border hover:bg-surface-2 flex h-11 items-center gap-2 rounded-lg border pr-2 pl-1.5"
      trigger={
        <>
          {/* Bosh harflar CSS orqali chiziladi: ular tugma nomining (aria-label) bir qismi emas, shuning uchun
              matn DOM'ga kirmaydi va WCAG 2.5.3 (ko'rinadigan matn nomda bo'lishi) buzilmaydi. */}
          <span
            aria-hidden="true"
            data-initials={initials(user.name)}
            className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-900 before:content-[attr(data-initials)] dark:bg-indigo-950 dark:text-indigo-200"
          />
          <DownOutlined aria-hidden="true" className="text-muted text-[10px]" />
        </>
      }
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="border-border flex flex-col gap-0.5 border-b px-4 py-3">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-muted text-xs">{user.email}</span>
            <span className="text-accent-text mt-1 text-xs font-semibold">
              {t(`roles.${user.role}`)} · {user.dept}
            </span>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted text-xs font-semibold">
                {t("shell.language")}
              </span>
              <Suspense fallback={null}>
                <LanguageSwitcher />
              </Suspense>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted text-xs font-semibold">{t("shell.theme")}</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="border-border flex flex-col gap-0.5 border-t p-2">
            <Link
              href="/profile"
              onClick={close}
              className="hover:bg-surface-2 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
            >
              <UserOutlined aria-hidden="true" />
              {t("shell.profile")}
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="hover:bg-surface-2 flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium"
            >
              <LogoutOutlined aria-hidden="true" />
              {t("common.logout")}
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
