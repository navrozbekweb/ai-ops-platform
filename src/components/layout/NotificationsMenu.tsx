"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BellOutlined } from "@ant-design/icons";
import { Popover } from "@/components/ui/Popover";
import type { Role } from "@/lib/auth/roles";
import { NOTIFICATIONS_BY_ROLE } from "@/lib/mock/notifications";

function relativeTime(locale: string, minutesAgo: number): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return minutesAgo < 60
    ? formatter.format(-minutesAgo, "minute")
    : formatter.format(-Math.round(minutesAgo / 60), "hour");
}

export function NotificationsMenu({ role }: { role: Role }) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const items = NOTIFICATIONS_BY_ROLE[role];
  const [read, setRead] = useState<ReadonlySet<string>>(new Set());
  const unread = items.filter((item) => !read.has(item.id)).length;

  return (
    <Popover
      label={t("label", { count: unread })}
      triggerClassName="border-border text-text hover:bg-surface-2 relative flex size-11 items-center justify-center rounded-lg border"
      trigger={
        <>
          <BellOutlined aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="bg-accent absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] leading-5 font-semibold text-white"
            >
              {unread}
            </span>
          ) : null}
        </>
      }
    >
      {() => (
        <div className="flex flex-col">
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{t("title")}</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => setRead(new Set(items.map((item) => item.id)))}
              className="text-accent-text min-h-11 text-xs font-semibold disabled:opacity-50"
            >
              {t("markAll")}
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-muted px-4 py-6 text-sm">{t("empty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => {
                const isUnread = !read.has(item.id);
                return (
                  <li key={item.id} className="border-border border-b last:border-0">
                    <button
                      type="button"
                      onClick={() => setRead((prev) => new Set(prev).add(item.id))}
                      className="hover:bg-surface-2 flex min-h-11 w-full gap-3 px-4 py-3 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${isUnread ? "bg-accent" : "bg-transparent"}`}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold">
                          {isUnread ? (
                            <span className="sr-only">{t("unread")}: </span>
                          ) : null}
                          {t(`items.${item.key}.title`)}
                        </span>
                        <span className="text-muted text-sm">
                          {t(`items.${item.key}.body`)}
                        </span>
                        <span className="text-muted text-xs">
                          {relativeTime(locale, item.minutesAgo)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}
