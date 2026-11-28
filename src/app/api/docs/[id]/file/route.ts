import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/guard";
import { withActor } from "@/lib/api/respond";
import { downloadDocFile } from "@/lib/data/sections";

/** ASCII bo'lmagan nomlar uchun RFC 5987 (`filename*`) bilan, eski brauzerlar uchun oddiy zaxira nom. */
function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\w.-]+/g, "_") || "file";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withActor(request, (actor) => {
    const result = downloadDocFile(actor, id);
    if (!result.ok) return jsonError(result.error, result.status);
    const { file, bytes } = result.value;
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": file.mime,
        "Content-Length": String(bytes.byteLength),
        // Brauzerda ochilib, skript ishlatib yubormasligi uchun: faqat yuklab olish.
        "Content-Disposition": contentDisposition(file.name),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  });
}
