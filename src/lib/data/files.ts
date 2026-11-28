import "server-only";
import { DOC_FILE_MAX_BYTES, DOC_FILE_TYPES, fileExtension } from "@/lib/schemas/files";
import { fail, ok, type Result } from "./service";
import type { DocFile } from "./types";

/**
 * MOCK fayl ombori (xotirada, `globalThis` da). Haqiqiy backendda bu fayl
 * obyekt omboriga (S3, Vercel Blob va h.k.) yoziladi, hujjat yozuvida esa faqat metama'lumot qoladi.
 * Serverless'da har instansiya alohida xotira oladi va qayta ishga tushganda bo'shaydi.
 */
const KEY = Symbol.for("aiops.mock.files");
type Holder = { [KEY]?: Map<string, Uint8Array> };

/** Butun ombor chegarasi: xotira to'lib ketmasligi uchun. */
const STORE_LIMIT_BYTES = 50 * 1024 * 1024;

function store(): Map<string, Uint8Array> {
  const holder = globalThis as typeof globalThis & Holder;
  holder[KEY] ??= new Map();
  return holder[KEY];
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/** Kengaytmaga mos "sehrli baytlar": nomini o'zgartirib yuborilgan boshqa fayl turini ushlaydi. */
function contentMatches(ext: string, bytes: Uint8Array): boolean {
  switch (ext) {
    case "pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
    case "docx":
    case "xlsx":
    case "pptx":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "doc":
    case "xls":
    case "ppt":
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);
    case "png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
    case "jpg":
    case "jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "txt":
    case "csv":
      return !bytes.subarray(0, 8192).includes(0);
    default:
      return false;
  }
}

/** Yo'l ajratgichlari, boshqaruv belgilari va juda uzun nomlarni olib tashlaydi. */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, "").trim();
  if (clean.length <= 120) return clean;
  const ext = fileExtension(clean);
  return `${clean.slice(0, 110)}.${ext}`;
}

export function validateUpload(name: string, bytes: Uint8Array): Result<DocFile> {
  const clean = sanitizeFileName(name);
  const ext = fileExtension(clean);
  if (!clean || !(ext in DOC_FILE_TYPES)) return fail("fileType");
  if (bytes.byteLength === 0) return fail("validation");
  if (bytes.byteLength > DOC_FILE_MAX_BYTES) return fail("fileTooLarge");
  if (!contentMatches(ext, bytes)) return fail("fileType");
  return ok({ name: clean, size: bytes.byteLength, mime: DOC_FILE_TYPES[ext] });
}

function usedBytes(): number {
  let total = 0;
  for (const bytes of store().values()) total += bytes.byteLength;
  return total;
}

export function saveFile(docId: string, bytes: Uint8Array): Result<null> {
  if (usedBytes() + bytes.byteLength > STORE_LIMIT_BYTES) return fail("storageFull");
  store().set(docId, bytes);
  return ok(null);
}

export function readFile(docId: string): Uint8Array | null {
  return store().get(docId) ?? null;
}

export function removeFile(docId: string): void {
  store().delete(docId);
}
