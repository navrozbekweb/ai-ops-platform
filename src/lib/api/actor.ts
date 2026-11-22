import "server-only";
import { getSession } from "@/lib/auth/session";
import { findActor, type ApiErrorCode } from "@/lib/data/service";
import type { Person } from "@/lib/data/types";

/** Sessiyadan joriy foydalanuvchini oladi; blokdagi yoki o'chirilgan hisob sessiyasi yaroqsiz. */
export async function currentActor(): Promise<Person | null> {
  const session = await getSession();
  return findActor(session?.sub);
}

export type { ApiErrorCode };
