import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { createDoc, listDocs } from "@/lib/data/sections";
import { docCreateSchema } from "@/lib/schemas/sections";

export async function GET(request: NextRequest) {
  return withActor(request, (actor) =>
    respond({ ok: true, value: listDocs(actor) }, (docs) => ({ docs })),
  );
}

export async function POST(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, docCreateSchema);
      if (!body.ok) return body.response;
      return respond(createDoc(actor, body.data), (doc) => ({ doc }));
    },
    { write: true },
  );
}
