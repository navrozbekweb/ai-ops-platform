import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageActor } from "@/lib/auth/actor-page";
import { HOME_SECTION } from "@/lib/auth/roles";
import { analytics } from "@/lib/data/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("analytics") };
}

const STATUS_COLOR = {
  todo: "var(--muted)",
  in_progress: "var(--accent)",
  review: "var(--warning)",
  done: "var(--success)",
} as const;

/** Chiziq (bar): rang bilan birga doim raqam ham yoziladi, shuning uchun ma'no rangga bog'liq emas. */
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const width =
    max > 0 ? Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div
      aria-hidden="true"
      className="bg-surface-2 h-2.5 flex-1 overflow-hidden rounded-full"
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await requirePageActor(locale, "analytics");
  const result = analytics(actor);
  if (!result.ok) redirect(`/${locale}/${HOME_SECTION}`);
  const data = result.value;

  const t = await getTranslations("analytics");
  const tStatus = await getTranslations("tasks.status");

  const kpis = [
    { key: "total", value: String(data.totals.tasks) },
    { key: "open", value: String(data.totals.open) },
    { key: "done", value: String(data.totals.done) },
    { key: "late", value: String(data.totals.late) },
    { key: "rate", value: `${data.totals.rate}%` },
  ];
  const maxStatus = Math.max(0, ...data.byStatus.map((s) => s.count));
  const maxDept = Math.max(0, ...data.byDept.map((d) => d.open + d.done));

  const card = "border-border bg-surface flex flex-col gap-4 rounded-xl border p-5";

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section aria-label="KPI" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map(({ key, value }) => (
          <div
            key={key}
            className="border-border bg-surface flex flex-col gap-2.5 rounded-xl border p-5"
          >
            <span className="text-muted text-sm font-medium">{t(`kpi.${key}`)}</span>
            <span className="text-3xl leading-none font-bold">{value}</span>
          </div>
        ))}
      </section>

      {data.totals.tasks === 0 ? (
        <div className="border-border bg-surface rounded-xl border">
          <EmptyState title={t("empty")} />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <section aria-labelledby="an-status" className={card}>
            <h2 id="an-status" className="text-base font-semibold">
              {t("byStatus")}
            </h2>
            <ul className="flex flex-col gap-3">
              {data.byStatus.map(({ status, count }) => (
                <li key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0">{tStatus(status)}</span>
                  <Bar value={count} max={maxStatus} color={STATUS_COLOR[status]} />
                  <span className="w-8 text-right font-semibold tabular-nums">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="an-dept" className={card}>
            <h2 id="an-dept" className="text-base font-semibold">
              {t("byDept")}
            </h2>
            <ul className="flex flex-col gap-3">
              {data.byDept.map(({ dept, open, done }) => (
                <li key={dept} className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{dept}</span>
                    <span className="text-muted tabular-nums">
                      {t("legendOpen")}: {open} · {t("legendDone")}: {done}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="bg-surface-2 flex h-2.5 overflow-hidden rounded-full"
                  >
                    <div
                      style={{
                        width: `${maxDept ? (open / maxDept) * 100 : 0}%`,
                        background: "var(--accent)",
                      }}
                    />
                    <div
                      style={{
                        width: `${maxDept ? (done / maxDept) * 100 : 0}%`,
                        background: "var(--success)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="an-person" className={`${card} xl:col-span-2`}>
            <h2 id="an-person" className="text-base font-semibold">
              {t("byPerson")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t("caption")}</caption>
                <thead>
                  <tr className="border-border text-muted border-b">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("columns.name")}
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      {t("columns.open")}
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      {t("columns.done")}
                    </th>
                    <th scope="col" className="py-2 pl-4 text-right font-medium">
                      {t("columns.late")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPerson.map((p) => (
                    <tr key={p.id} className="border-border border-b last:border-0">
                      <th scope="row" className="py-2.5 pr-4 font-medium">
                        {p.name}
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums">{p.open}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{p.done}</td>
                      <td
                        className={`py-2.5 pl-4 text-right tabular-nums ${p.late > 0 ? "text-danger font-semibold" : ""}`}
                      >
                        {p.late}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
