import "server-only";
import type { NextRequest } from "next/server";
import { currentActor } from "@/lib/api/actor";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api/guard";
import type { Result } from "@/lib/data/service";
import type { Person } from "@/lib/data/types";

/** Natijani JSON javobga aylantiradi: xato kodlari klientda tarjima qilinadi. */
export function respond<T>(
  result: Result<T>,
  toBody: (value: T) => Record<string, unknown>,
) {
  return result.ok
    ? jsonOk(toBody(result.value))
    : jsonError(result.error, result.status);
}

/** Sessiya majburiy. Yozuvchi so'rovlarda qo'shimcha CSRF (Origin) tekshiruvi. */
export async function withActor(
  request: NextRequest,
  handler: (actor: Person) => Promise<Response> | Response,
  { write = false }: { write?: boolean } = {},
) {
  if (write && !isSameOrigin(request)) return jsonError("forbidden", 403);
  const actor = await currentActor();
  if (!actor) return jsonError("unauthorized", 401);
  return handler(actor);
}
