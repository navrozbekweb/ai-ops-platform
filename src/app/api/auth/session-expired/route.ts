import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { currentActor } from "@/lib/api/actor";
import { destroySession } from "@/lib/auth/session";
import { HOME_SECTION } from "@/lib/auth/roles";

/**
 * Hisob bloklangan yoki o'chirilgan, lekin brauzerda hali imzosi yaroqli sessiya bor.
 * Panel shu manzilga yo'naltiradi: cookie tozalanadi va login sahifasi ochiladi.
 * Hisob aslida faol bo'lsa (masalan, qayta yoqilgan), hech narsa o'chirilmaydi.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = (routing.locales as readonly string[]).includes(requested)
    ? requested
    : routing.defaultLocale;

  if (await currentActor()) {
    return NextResponse.redirect(new URL(`/${locale}/${HOME_SECTION}`, request.url));
  }
  await destroySession();
  const url = new URL(`/${locale}/login`, request.url);
  url.searchParams.set("reason", "blocked");
  return NextResponse.redirect(url);
}
