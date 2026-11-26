import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePageActor } from "@/lib/auth/actor-page";
import { ROLES, SECTIONS, canAccess } from "@/lib/auth/roles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("roles") };
}

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageActor(locale, "roles");
  const t = await getTranslations("permissions");
  const tNav = await getTranslations("nav");
  const tRoles = await getTranslations("roles");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="border-border bg-surface overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="border-border text-muted border-b">
              <th scope="col" className="px-4 py-3 font-medium">
                {t("section")}
              </th>
              {ROLES.map((role) => (
                <th key={role} scope="col" className="px-4 py-3 text-center font-medium">
                  {tRoles(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section) => (
              <tr key={section} className="border-border border-b last:border-0">
                <th scope="row" className="px-4 py-3 font-medium">
                  {tNav(section)}
                </th>
                {ROLES.map((role) => {
                  const allowed = canAccess(role, section);
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <span
                        role="img"
                        aria-label={allowed ? t("allowed") : t("denied")}
                        className={allowed ? "text-success" : "text-muted"}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="inline-block"
                        >
                          {allowed ? (
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          ) : (
                            <path d="M6 12h12" />
                          )}
                        </svg>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted text-sm">{t("note")}</p>
    </>
  );
}
