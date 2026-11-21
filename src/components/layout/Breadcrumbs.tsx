"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { HOME_SECTION, isSection } from "@/lib/auth/roles";

/** Joriy bo'limgacha yo'l: Boshqaruv paneli / Bo'lim. Oxirgi element joriy sahifa. */
export function Breadcrumbs() {
  const t = useTranslations();
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  const current = isSection(segment) && segment !== HOME_SECTION ? segment : null;

  return (
    <nav aria-label={t("shell.breadcrumb")} className="min-w-0">
      <ol className="flex items-center gap-2 text-sm">
        <li className="min-w-0">
          {current ? (
            <Link
              href={`/${HOME_SECTION}`}
              className="text-muted hover:text-text truncate underline-offset-2 hover:underline"
            >
              {t(`nav.${HOME_SECTION}`)}
            </Link>
          ) : (
            <span aria-current="page" className="block truncate font-semibold">
              {t(`nav.${HOME_SECTION}`)}
            </span>
          )}
        </li>
        {current ? (
          <>
            <li aria-hidden="true" className="text-muted">
              /
            </li>
            <li className="min-w-0">
              <span aria-current="page" className="block truncate font-semibold">
                {t(`nav.${current}`)}
              </span>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
