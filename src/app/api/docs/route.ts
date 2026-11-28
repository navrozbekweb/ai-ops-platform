import type { NextRequest } from "next/server";
import { clientIp, jsonError, rateLimit, readJson } from "@/lib/api/guard";
import { respond, withActor } from "@/lib/api/respond";
import { createDoc, listDocs, type UploadedFile } from "@/lib/data/sections";
import { DOC_FILE_MAX_BYTES } from "@/lib/schemas/files";
import { docCreateSchema } from "@/lib/schemas/sections";

/** Multipart so'rov: maydonlar + ixtiyoriy `file`. Boshqa maydonlar uchun ham joy qoldiriladi. */
const MAX_MULTIPART_BYTES = DOC_FILE_MAX_BYTES + 64 * 1024;

export async function GET(request: NextRequest) {
  return withActor(request, (actor) =>
    respond({ ok: true, value: listDocs(actor) }, (docs) => ({ docs })),
  );
}

async function readMultipart(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_MULTIPART_BYTES) return { error: jsonError("fileTooLarge", 413) };

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { error: jsonError("validation", 400) };
  }

  const parsed = docCreateSchema.safeParse({
    title: form.get("title"),
    category: form.get("category"),
    description: form.get("description") ?? "",
    shared: form.get("shared") === "true",
  });
  if (!parsed.success) return { error: jsonError("validation", 400) };

  let upload: UploadedFile | undefined;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    // Content-Length yo'q (chunked) so'rovlar uchun ikkinchi tekshiruv.
    if (file.size > DOC_FILE_MAX_BYTES) return { error: jsonError("fileTooLarge", 413) };
    upload = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
  }
  return { data: parsed.data, upload };
}

export async function POST(request: NextRequest) {
  return withActor(
    request,
    async (actor) => {
      const isMultipart = request.headers
        .get("content-type")
        ?.includes("multipart/form-data");

      if (isMultipart) {
        const limit = rateLimit(`upload:${actor.id}:${clientIp(request)}`, 20, 60 * 1000);
        if (!limit.allowed) {
          const response = jsonError("rate_limited", 429);
          response.headers.set("Retry-After", String(limit.retryAfter));
          return response;
        }
        const body = await readMultipart(request);
        if (body.error) return body.error;
        return respond(createDoc(actor, body.data, body.upload), (doc) => ({ doc }));
      }

      const body = await readJson(request, docCreateSchema);
      if (!body.ok) return body.response;
      return respond(createDoc(actor, body.data), (doc) => ({ doc }));
    },
    { write: true },
  );
}
