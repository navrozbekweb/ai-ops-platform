"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({ tone = "default" }: { tone?: "default" | "onDark" }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const wrapper =
    tone === "onDark" ? "border-white/28 bg-white/14" : "border-border bg-surface-2";

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`flex gap-1 rounded-full border p-1 ${wrapper}`}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        const activeClass =
          tone === "onDark" ? "bg-white text-slate-900" : "bg-accent text-white";
        const idleClass =
          tone === "onDark"
            ? "text-white hover:bg-white/15"
            : "text-muted hover:text-text";
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => {
              const query = Object.fromEntries(searchParams.entries());
              router.replace({ pathname, query }, { locale: code });
            }}
            className={`h-9 min-w-11 rounded-full px-3 text-xs font-semibold uppercase transition ${
              active ? activeClass : idleClass
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
