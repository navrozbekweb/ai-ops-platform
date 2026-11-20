import type { NextRequest } from "next/server";
import { forgotSchema } from "@/lib/auth/schemas";
import { signResetToken } from "@/lib/auth/token";
import { clientIp, jsonError, jsonOk, rateLimit, readJson } from "@/lib/api/guard";
import { isMockAuthEnabled } from "@/lib/mock/users";

export async function POST(request: NextRequest) {
  if (!isMockAuthEnabled()) return jsonError("disabled", 503);

  const body = await readJson(request, forgotSchema);
  if (!body.ok) return body.response;
  const { email, locale } = body.data;

  const limit = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    const response = jsonError("rate_limited", 429);
    response.headers.set("Retry-After", String(limit.retryAfter));
    return response;
  }

  // Foydalanuvchi mavjudligi oshkor bo'lmasligi uchun javob har doim bir xil.
  // Mock rejimida pochta yuborilmaydi: havola javobda qaytariladi (har qanday email uchun).
  const token = await signResetToken(email);
  return jsonOk({
    demoLink: `/${locale}/reset-password?token=${encodeURIComponent(token)}`,
  });
}
