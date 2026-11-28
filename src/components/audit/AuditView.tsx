"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/fields";
import { formatDateTime } from "@/lib/client/api";
import { AUDIT_ACTIONS, type AuditEntry } from "@/lib/data/types";

export function AuditView({ entries }: { entries: AuditEntry[] }) {
  const t = useTranslations("audit");
  const [action, setAction] = useState("all");

  const rows = useMemo(
    () => (action === "all" ? entries : entries.filter((e) => e.action === action)),
    [entries, action],
  );

  const columns: Column<AuditEntry>[] = [
    {
      id: "time",
      header: t("columns.time"),
      sortValue: (e) => e.at,
      cell: (e) => <span className="whitespace-nowrap">{formatDateTime(e.at)}</span>,
    },
    {
      id: "actor",
      header: t("columns.actor"),
      sortValue: (e) => e.actorName,
      cell: (e) => e.actorName,
    },
    {
      id: "action",
      header: t("columns.action"),
      sortValue: (e) => e.action,
      cell: (e) => <Badge tone="info">{t(`actions.${e.action}`)}</Badge>,
    },
    {
      id: "target",
      header: t("columns.target"),
      showFrom: "md",
      sortValue: (e) => e.target,
      cell: (e) => e.target,
    },
  ];

  return (
    <DataTable
      caption={t("caption")}
      rows={rows}
      columns={columns}
      getRowId={(e) => e.id}
      searchText={(e) => `${e.actorName} ${e.target}`}
      initialSort={{ id: "time", dir: "desc" }}
      filters={
        <FilterSelect label={t("filters.action")} value={action} onChange={setAction}>
          <option value="all">{t("filters.all")}</option>
          {AUDIT_ACTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`actions.${value}`)}
            </option>
          ))}
        </FilterSelect>
      }
      empty={{ title: t("empty.title"), text: t("empty.text") }}
    />
  );
}
