import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function AppNotFound() {
  const t = useTranslations("errors.notFound");

  return (
    <div className="border-border bg-surface mx-auto flex w-full max-w-lg flex-col items-start gap-3 rounded-xl border p-6">
      <p className="text-accent-text text-sm font-semibold">404</p>
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-muted text-sm">{t("text")}</p>
      <Link
        href="/dashboard"
        className="bg-accent mt-2 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {t("back")}
      </Link>
    </div>
  );
}
