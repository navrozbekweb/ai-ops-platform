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

export const NAV_GROUP_IDS = ["overview", "work", "administration"] as const;
export type NavGroupId = (typeof NAV_GROUP_IDS)[number];
export type NavGroup = { id: NavGroupId; items: readonly Section[] };

/**
 * Har rol uchun sidebar guruhlari va tartibi. Aynan shu ro'yxat kirish huquqini ham belgilaydi.
 * "profile" menyuda emas: u hamma uchun ochiq va sarlavhadagi profil menyusidan olinadi.
 */
export const NAV_GROUPS_BY_ROLE: Record<Role, readonly NavGroup[]> = {
  admin: [
    { id: "overview", items: ["dashboard", "analytics"] },
    { id: "work", items: ["tasks", "documents", "ai"] },
    { id: "administration", items: ["users", "roles", "audit", "settings"] },
  ],
  manager: [
    { id: "overview", items: ["dashboard", "analytics"] },
    { id: "work", items: ["team", "tasks", "approvals", "documents", "ai"] },
  ],
  employee: [
    { id: "overview", items: ["dashboard"] },
    { id: "work", items: ["tasks", "documents", "ai"] },
  ],
};

/** Tekis ro'yxat (qidiruv va ruxsat tekshiruvi uchun). */
export function navItemsFor(role: Role): readonly Section[] {
  return NAV_GROUPS_BY_ROLE[role].flatMap((group) => group.items);
}

/** Barcha rollar uchun ochiq bo'limlar (menyuda ko'rinmasa ham). */
const ALWAYS_ALLOWED: readonly Section[] = ["dashboard", "profile"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

export function canAccess(role: Role, section: Section): boolean {
  return ALWAYS_ALLOWED.includes(section) || navItemsFor(role).includes(section);
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
