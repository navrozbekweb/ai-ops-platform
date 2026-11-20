import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/roles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("dashboard") };
}

// Namuna raqamlar. Haqiqiy API ulanganda shu yerda o'qiladi.
const KPI_BY_ROLE: Record<Role, ReadonlyArray<{ key: string; value: string }>> = {
  admin: [
    { key: "users", value: "57" },
    { key: "sessions", value: "42" },
    { key: "requests", value: "5" },
    { key: "system", value: "stable" },
  ],
  manager: [
    { key: "teamTasks", value: "34" },
    { key: "pending", value: "3" },
    { key: "teamPerf", value: "88%" },
    { key: "late", value: "2" },
  ],
  employee: [
    { key: "myTasks", value: "6" },
    { key: "doneWeek", value: "9" },
    { key: "myPerf", value: "91%" },
  ],
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: "/login", locale });
  const user = session!;

  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");
  const capabilities = t.raw(`capabilities.${user.role}`) as string[];

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("welcome", { name: user.name.split(" ")[0] })}
        </h1>
        <p className="text-muted text-sm">
          <span className="text-text font-semibold">{tRoles(user.role)}</span>
          {" · "}
          {t(`subtitle.${user.role}`)}
        </p>
      </div>

      <section
        aria-label="KPI"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {KPI_BY_ROLE[user.role].map(({ key, value }) => (
          <div
            key={key}
            className="border-border bg-surface flex flex-col gap-2.5 rounded-xl border p-5"
          >
            <span className="text-muted text-sm font-medium">{t(`kpi.${key}`)}</span>
            <span className="text-3xl leading-none font-bold">
              {value === "stable" ? t("kpi.stable") : value}
            </span>
          </div>
        ))}
      </section>

      <section className="border-border bg-surface rounded-xl border p-5">
        <h2 className="mb-3 text-base font-semibold">{t("capabilitiesTitle")}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {capabilities.map((item) => (
            <li key={item} className="flex gap-2">
              <span
                aria-hidden="true"
                className="bg-accent mt-1.5 size-1.5 shrink-0 rounded-full"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
