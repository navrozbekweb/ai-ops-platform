"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/AppProviders";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: ThemePreference[] = ["light", "dark", "system"];

export function ThemeToggle({ tone = "default" }: { tone?: "default" | "onDark" }) {
  const t = useTranslations("theme");
  const { preference, setPreference } = useTheme();

  const wrapper =
    tone === "onDark" ? "border-white/28 bg-white/14" : "border-border bg-surface-2";

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex gap-1 rounded-full border p-1 ${wrapper}`}
    >
      {OPTIONS.map((option) => {
        const active = option === preference;
        const activeClass =
          tone === "onDark" ? "bg-white text-slate-900" : "bg-accent text-white";
        const idleClass =
          tone === "onDark"
            ? "text-white hover:bg-white/15"
            : "text-muted hover:text-text";
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setPreference(option)}
            className={`h-9 min-w-11 rounded-full px-3 text-xs font-semibold transition ${
              active ? activeClass : idleClass
            }`}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
