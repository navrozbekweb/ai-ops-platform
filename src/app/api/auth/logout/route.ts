import type { NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api/guard";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  await destroySession();
  return jsonOk({});
}
