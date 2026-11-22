import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { deleteTask, updateTask } from "@/lib/data/service";
import { taskUpdateSchema } from "@/lib/schemas/directory";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, taskUpdateSchema);
      if (!body.ok) return body.response;
      return respond(updateTask(actor, id, body.data), (task) => ({ task }));
    },
    { write: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withActor(request, (actor) => respond(deleteTask(actor, id), () => ({})), {
    write: true,
  });
}
