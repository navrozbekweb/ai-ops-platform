import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePageActor } from "@/lib/auth/actor-page";
import { statsFor } from "@/lib/data/service";
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

type Stats = ReturnType<typeof statsFor>;

// Raqamlar ma'lumotlar ombordan hisoblanadi (Vazifalar sahifasi bilan mos). Sessiyalar,
// samaradorlik va tizim holati hozircha namunaviy: ularning manbai keyingi bosqichda ulanadi.
const KPI_BY_ROLE: Record<
  Role,
  (s: Stats) => ReadonlyArray<{ key: string; value: string }>
> = {
  admin: (s) => [
    { key: "users", value: String(s.users) },
    { key: "sessions", value: "42" },
    { key: "requests", value: String(s.pending) },
    { key: "system", value: "stable" },
  ],
  manager: (s) => [
    { key: "teamTasks", value: String(s.teamTasks) },
    { key: "pending", value: String(s.pending) },
    { key: "teamPerf", value: "88%" },
    { key: "late", value: String(s.late) },
  ],
  employee: (s) => [
    { key: "myTasks", value: String(s.myTasks) },
    { key: "doneWeek", value: String(s.doneWeek) },
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
  const user = await requirePageActor(locale);
  const stats = statsFor(user);

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
        {KPI_BY_ROLE[user.role](stats).map(({ key, value }) => (
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
