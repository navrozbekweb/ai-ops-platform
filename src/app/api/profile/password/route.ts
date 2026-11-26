import type { NextRequest } from "next/server";
import { clientIp, jsonError, rateLimit, readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { changeOwnPassword } from "@/lib/data/sections";
import { passwordChangeSchema } from "@/lib/schemas/sections";

export async function POST(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, passwordChangeSchema);
      if (!body.ok) return body.response;

      // Joriy parolni taxmin qilishdan himoya.
      const limit = rateLimit(`pwd:${actor.id}:${clientIp(request)}`, 8, 15 * 60 * 1000);
      if (!limit.allowed) {
        const response = jsonError("rate_limited", 429);
        response.headers.set("Retry-After", String(limit.retryAfter));
        return response;
      }
      return respond(changeOwnPassword(actor, body.data), () => ({}));
    },
    { write: true },
  );
}
