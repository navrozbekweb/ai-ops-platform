"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { TeamRow } from "@/lib/data/service";
import { TaskFormModal, type AssigneeOption } from "@/components/tasks/TaskFormModal";

/** Rahbarning jamoasi: faqat o'qish + vazifa tayinlash. Xodim qo'shish/o'chirish yo'q. */
export function TeamView({
  rows,
  assignees,
  today,
}: {
  rows: TeamRow[];
  assignees: AssigneeOption[];
  today: string;
}) {
  const t = useTranslations("team");
  const [assignTo, setAssignTo] = useState<string | null>(null);

  const columns: Column<TeamRow>[] = [
    {
      id: "name",
      header: t("columns.member"),
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{p.name}</span>
          <span className="text-muted truncate text-xs">{p.email}</span>
        </div>
      ),
    },
    {
      id: "dept",
      header: t("columns.dept"),
      showFrom: "md",
      sortValue: (p) => p.dept,
      cell: (p) => p.dept,
    },
    {
      id: "open",
      header: t("columns.open"),
      sortValue: (p) => p.open,
      cell: (p) => p.open,
    },
    {
      id: "review",
      header: t("columns.review"),
      showFrom: "md",
      sortValue: (p) => p.review,
      cell: (p) => p.review,
    },
    {
      id: "done",
      header: t("columns.done"),
      showFrom: "lg",
      sortValue: (p) => p.done,
      cell: (p) => p.done,
    },
    {
      id: "actions",
      header: t("columns.actions"),
      hiddenHeader: true,
      mobileInline: true,
      cell: (p) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            aria-label={t("assignAria", { name: p.name })}
            onClick={() => setAssignTo(p.id)}
          >
            {t("assign")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption={t("caption")}
        rows={rows}
        columns={columns}
        getRowId={(p) => p.id}
        searchText={(p) => `${p.name} ${p.email} ${p.dept}`}
        initialSort={{ id: "name", dir: "asc" }}
        empty={{ title: t("empty.title"), text: t("empty.text") }}
      />
      <TaskFormModal
        open={assignTo !== null}
        onClose={() => setAssignTo(null)}
        editing={null}
        assignees={assignees}
        defaultAssigneeId={assignTo ?? undefined}
        today={today}
      />
    </>
  );
}
