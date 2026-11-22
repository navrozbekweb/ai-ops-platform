import "server-only";
import { redirect } from "next/navigation";
import { currentActor } from "@/lib/api/actor";
import { canAccess, type Section } from "@/lib/auth/roles";
import { HOME_SECTION } from "@/lib/auth/roles";
import type { Person } from "@/lib/data/types";

/**
 * Sahifalar uchun joriy foydalanuvchi (rol ombordan olinadi, JWT dan emas).
 * Hisob yo'q yoki bloklangan bo'lsa, sessiya tozalanib login'ga yo'naltiriladi.
 * `section` berilsa, rolga ruxsat yo'q bo'lganda bosh sahifaga qaytariladi.
 */
export async function requirePageActor(
  locale: string,
  section?: Section,
): Promise<Person> {
  const actor = await currentActor();
  if (!actor) redirect(`/api/auth/session-expired?locale=${locale}`);
  if (section && !canAccess(actor.role, section)) redirect(`/${locale}/${HOME_SECTION}`);
  return actor;
}
