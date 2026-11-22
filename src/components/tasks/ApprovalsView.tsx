"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { TaskView } from "@/lib/data/types";
import { ReturnTaskModal } from "./ReturnTaskModal";
import {
  DueCell,
  PriorityBadge,
  TaskActions,
  TaskTitleCell,
  useTaskActions,
} from "./shared";

/** Tekshiruv kutayotgan vazifalar: tasdiqlash yoki sabab bilan qaytarish. */
export function ApprovalsView({ tasks, today }: { tasks: TaskView[]; today: string }) {
  const t = useTranslations("tasks");
  const ta = useTranslations("approvals");
  const { advance } = useTaskActions();
  const [returning, setReturning] = useState<TaskView | null>(null);

  const columns: Column<TaskView>[] = [
    {
      id: "title",
      header: t("columns.task"),
      sortValue: (task) => task.title,
      cell: (task) => <TaskTitleCell task={task} />,
    },
    {
      id: "assignee",
      header: t("columns.assignee"),
      sortValue: (task) => task.assigneeName,
      cell: (task) => task.assigneeName,
    },
    {
      id: "priority",
      header: t("columns.priority"),
      showFrom: "lg",
      cell: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      id: "due",
      header: t("columns.due"),
      showFrom: "md",
      sortValue: (task) => task.due,
      cell: (task) => <DueCell task={task} today={today} />,
    },
    {
      id: "actions",
      header: t("columns.actions"),
      hiddenHeader: true,
      mobileInline: true,
      cell: (task) => (
        <TaskActions task={task} onAdvance={advance} onReturn={setReturning} />
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption={ta("caption")}
        rows={tasks}
        columns={columns}
        getRowId={(task) => task.id}
        searchText={(task) => `${task.title} ${task.assigneeName}`}
        initialSort={{ id: "due", dir: "asc" }}
        empty={{ title: ta("empty.title"), text: ta("empty.text") }}
      />
      <ReturnTaskModal task={returning} onClose={() => setReturning(null)} />
    </>
  );
}
