import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { updateProfile } from "@/lib/data/sections";
import { profileSchema } from "@/lib/schemas/sections";

export async function PATCH(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, profileSchema);
      if (!body.ok) return body.response;
      return respond(updateProfile(actor, body.data), (user) => ({ user }));
    },
    { write: true },
  );
}
