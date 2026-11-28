/**
 * Hujjatga biriktiriladigan fayl qoidalari. Brauzer (tez xabar berish uchun) ham, server
 * (haqiqiy tekshiruv) ham shu ro'yxatdan foydalanadi. Serverdagi tekshiruv asosiy:
 * brauzerdagisi faqat qulaylik uchun.
 */
export const DOC_FILE_MAX_BYTES = 2 * 1024 * 1024;

/** Ruxsat etilgan kengaytmalar va ularga mos Content-Type (mijoz yuborgan turga ishonilmaydi). */
export const DOC_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export const DOC_FILE_EXTENSIONS = Object.keys(DOC_FILE_TYPES);

/** `<input type="file" accept>` uchun. */
export const DOC_FILE_ACCEPT = DOC_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Brauzerdagi dastlabki tekshiruv natijasi (xabar kaliti `forms.validation.*` ichida). */
export function checkFileClientSide(file: {
  name: string;
  size: number;
}): "fileEmpty" | "fileTooLarge" | "fileType" | null {
  if (file.size === 0) return "fileEmpty";
  if (file.size > DOC_FILE_MAX_BYTES) return "fileTooLarge";
  if (!(fileExtension(file.name) in DOC_FILE_TYPES)) return "fileType";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
