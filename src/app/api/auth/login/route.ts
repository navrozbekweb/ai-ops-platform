import type { NextRequest } from "next/server";
import { HOME_SECTION } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";
import {
  clientIp,
  jsonError,
  jsonOk,
  rateLimit,
  readJson,
  resetRateLimit,
} from "@/lib/api/guard";
import { isMockAuthEnabled, verifyCredentials } from "@/lib/mock/users";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!isMockAuthEnabled()) return jsonError("disabled", 503);

  const body = await readJson(request, loginSchema);
  if (!body.ok) return body.response;
  const { email, password, locale } = body.data;

  const ipKey = `login:ip:${clientIp(request)}`;
  const accountKey = `login:acc:${email}`;
  const ip = rateLimit(ipKey, MAX_ATTEMPTS * 4, WINDOW_MS);
  const account = rateLimit(accountKey, MAX_ATTEMPTS, WINDOW_MS);
  if (!ip.allowed || !account.allowed) {
    const retryAfter = Math.max(ip.retryAfter, account.retryAfter);
    const response = jsonError("rate_limited", 429);
    response.headers.set("Retry-After", String(retryAfter));
    return response;
  }

  const user = verifyCredentials(email, password);
  if (!user) return jsonError("invalid", 401);

  resetRateLimit(accountKey);
  await createSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    dept: user.dept,
  });

  return jsonOk({ role: user.role, redirectTo: `/${locale}/${HOME_SECTION}` });
}
