import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { aiReply } from "@/lib/ai/mock";
import { clientIp, jsonError, jsonOk, rateLimit, readJson } from "@/lib/api/guard";
import { withActor } from "@/lib/api/respond";
import { getSettings } from "@/lib/data/sections";
import { aiChatSchema } from "@/lib/schemas/sections";

export async function POST(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, aiChatSchema);
      if (!body.ok) return body.response;
      if (!getSettings().aiEnabled) return jsonError("aiDisabled", 409);

      const limit = rateLimit(`ai:${actor.id}:${clientIp(request)}`, 30, 60 * 1000);
      if (!limit.allowed) {
        const response = jsonError("rate_limited", 429);
        response.headers.set("Retry-After", String(limit.retryAfter));
        return response;
      }

      const { key, params } = aiReply(actor, body.data.message);
      const t = await getTranslations({
        locale: body.data.locale,
        namespace: "ai.replies",
      });
      return jsonOk({ reply: t(key, params) });
    },
    { write: true },
  );
}
