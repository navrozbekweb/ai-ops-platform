/**
 * Rollar va bo'limlarga kirish huquqlari.
 * Bu fayl edge/proxy va server ikkalasida ishlaydi, shuning uchun hech qanday
 * server-only yoki React importi yo'q. Ikonkalar UI qatlamida (Sidebar) saqlanadi.
 */
export const ROLES = ["admin", "manager", "employee"] as const;
export type Role = (typeof ROLES)[number];

export const SECTIONS = [
  "dashboard",
  "users",
  "roles",
  "analytics",
  "team",
  "tasks",
  "approvals",
  "documents",
  "ai",
  "audit",
  "settings",
  "profile",
] as const;
export type Section = (typeof SECTIONS)[number];

/** Har rol uchun sidebar tartibi. Aynan shu ro'yxat kirish huquqini ham belgilaydi. */
export const NAV_BY_ROLE: Record<Role, readonly Section[]> = {
  admin: [
    "dashboard",
    "users",
    "roles",
    "analytics",
    "tasks",
    "documents",
    "ai",
    "audit",
    "settings",
  ],
  manager: ["dashboard", "analytics", "team", "tasks", "approvals", "documents", "ai"],
  employee: ["dashboard", "tasks", "documents", "ai", "profile"],
};

/** Barcha rollar uchun ochiq bo'limlar (menyuda ko'rinmasa ham). */
const ALWAYS_ALLOWED: readonly Section[] = ["dashboard", "profile"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

export function canAccess(role: Role, section: Section): boolean {
  return ALWAYS_ALLOWED.includes(section) || NAV_BY_ROLE[role].includes(section);
}

/** Login'dan keyin barcha rollar bitta manzilga tushadi, panel rolga qarab o'zgaradi. */
export const HOME_SECTION: Section = "dashboard";

/** Faqat ichki, nisbiy yo'lni qabul qiladi (open redirect'dan himoya). */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return null;
  try {
    const url = new URL(value, "http://internal.invalid");
    if (url.origin !== "http://internal.invalid") return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
