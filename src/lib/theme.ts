/** Server va klient ikkalasi ishlatadigan mavzu doimiylari ("use client" faylida emas). */
export const THEME_COOKIE = "aiops_theme";

export type ThemePreference = "light" | "dark" | "system";

export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}
