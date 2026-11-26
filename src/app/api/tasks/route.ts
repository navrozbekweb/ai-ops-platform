import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { createTask, listTasks } from "@/lib/data/service";
import { taskCreateSchema } from "@/lib/schemas/directory";

export async function GET(request: NextRequest) {
  return withActor(request, (actor) =>
    respond({ ok: true, value: listTasks(actor) }, (tasks) => ({ tasks })),
  );
}

export async function POST(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const body = await readJson(request, taskCreateSchema);
      if (!body.ok) return body.response;
      return respond(createTask(actor, body.data), (task) => ({ task }));
    },
    { write: true },
  );
}
