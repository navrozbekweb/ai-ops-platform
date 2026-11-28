import type { NextRequest } from "next/server";
import { respond, withActor } from "@/lib/api/respond";
import { deleteDoc } from "@/lib/data/sections";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withActor(request, (actor) => respond(deleteDoc(actor, id), () => ({})), {
    write: true,
  });
}
