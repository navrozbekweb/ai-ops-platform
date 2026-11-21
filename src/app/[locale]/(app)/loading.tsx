import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("errors");

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden="true" className="flex animate-pulse flex-col gap-6">
        <div className="bg-border h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="bg-surface border-border h-28 rounded-xl border" />
          ))}
        </div>
        <div className="bg-surface border-border h-48 rounded-xl border" />
      </div>
    </div>
  );
}
