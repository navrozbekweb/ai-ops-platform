import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { updateSettings } from "@/lib/data/sections";
import { settingsSchema } from "@/lib/schemas/sections";

export async function PATCH(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, settingsSchema);
      if (!body.ok) return body.response;
      return respond(updateSettings(actor, body.data), (settings) => ({ settings }));
    },
    { write: true },
  );
}
