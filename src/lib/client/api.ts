"use client";

import { useTranslations } from "next-intl";

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** JSON so'rov. Xato bo'lsa serverning xato kodi bilan `ApiError` tashlaydi. */
export async function api<T = Record<string, unknown>>(
  url: string,
  { method, body }: { method: "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("generic");
  }
  const data = (await response.json().catch(() => null)) as
    ({ ok: true } & T) | { ok: false; error?: string } | null;
  if (!response.ok || !data || data.ok === false) {
    throw new ApiError(data && "error" in data && data.error ? data.error : "generic");
  }
  return data as T;
}

/** Xato kodini foydalanuvchi tilidagi matnga aylantiradi. */
export function useApiErrorText() {
  const t = useTranslations("apiErrors");
  return (error: unknown): string => {
    const code = error instanceof ApiError ? error.code : "generic";
    return t.has(code) ? t(code) : t("generic");
  };
}

/** Sana har uch tilda bir xil: kun.oy.yil (brauzerning uz uchun sana qoliplari ishonchsiz). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}
