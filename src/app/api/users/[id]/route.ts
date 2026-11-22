import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { deleteUser, updateUser } from "@/lib/data/service";
import { userUpdateSchema } from "@/lib/schemas/directory";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, userUpdateSchema);
      if (!body.ok) return body.response;
      return respond(updateUser(actor, id, body.data), (user) => ({ user }));
    },
    { write: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withActor(request, (actor) => respond(deleteUser(actor, id), () => ({})), {
    write: true,
  });
}
