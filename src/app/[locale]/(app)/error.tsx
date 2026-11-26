"use client";

import { useTranslations } from "next-intl";

// Next.js 16 da xato chegarasiga `reset` emas, `retry` beriladi.
export default function ErrorState({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errors.generic");

  return (
    <div
      role="alert"
      className="border-border bg-surface mx-auto flex w-full max-w-lg flex-col items-start gap-3 rounded-xl border p-6"
    >
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-muted text-sm">{t("text")}</p>
      {error.digest ? <p className="text-muted text-xs">ID: {error.digest}</p> : null}
      <button
        type="button"
        onClick={() => retry()}
        className="bg-accent mt-2 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {t("retry")}
      </button>
    </div>
  );
}
