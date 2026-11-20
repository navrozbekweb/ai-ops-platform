import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { HOME_SECTION, canAccess, isSection } from "@/lib/auth/roles";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

const intl = createIntlMiddleware(routing);

const PUBLIC_PATHS = new Set(["/login", "/forgot-password", "/reset-password"]);
const LOCALE_RE = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

export default async function proxy(request: NextRequest) {
  const response = intl(request);

  // Til prefiksi yo'q bo'lsa next-intl o'zi yo'naltiradi.
  const match = request.nextUrl.pathname.match(LOCALE_RE);
  if (!match) return response;

  const locale = match[1];
  const path = (match[2] ?? "/").replace(/\/+$/, "") || "/";
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.has(path);

  if (!session && !isPublic) {
    const url = new URL(`/${locale}/login`, request.url);
    if (path !== "/") url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session) {
    // Kirgan foydalanuvchi login/forgot sahifalariga qaytmasin. Reset havolasi ochiq qoladi.
    if (isPublic && path !== "/reset-password") {
      return NextResponse.redirect(new URL(`/${locale}/${HOME_SECTION}`, request.url));
    }
    // Rol bo'yicha bo'lim himoyasi: /uz/users faqat admin uchun va hokazo.
    const section = path.split("/")[1];
    if (section && isSection(section) && !canAccess(session.role, section)) {
      return NextResponse.redirect(new URL(`/${locale}/${HOME_SECTION}`, request.url));
    }
  }

  return response;
}

export const config = {
  // API, statik fayllar va ichki Next yo'llari proxy'dan o'tmaydi.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
