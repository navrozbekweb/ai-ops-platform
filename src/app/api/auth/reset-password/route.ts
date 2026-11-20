import type { NextRequest } from "next/server";
import { resetSchema } from "@/lib/auth/schemas";
import { verifyResetToken } from "@/lib/auth/token";
import { clientIp, jsonError, jsonOk, rateLimit, readJson } from "@/lib/api/guard";
import { isMockAuthEnabled } from "@/lib/mock/users";

export async function POST(request: NextRequest) {
  if (!isMockAuthEnabled()) return jsonError("disabled", 503);

  const body = await readJson(request, resetSchema);
  if (!body.ok) return body.response;

  const limit = rateLimit(`reset:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    const response = jsonError("rate_limited", 429);
    response.headers.set("Retry-After", String(limit.retryAfter));
    return response;
  }

  const email = await verifyResetToken(body.data.token);
  if (!email) return jsonError("invalid_token", 400);

  // MOCK: demo hisoblar xotirada saqlanadi va serverless'da yangilanmaydi.
  // Haqiqiy backendda shu yerda parol yangilanadi va token bir martalik qilinadi.
  return jsonOk({});
}
