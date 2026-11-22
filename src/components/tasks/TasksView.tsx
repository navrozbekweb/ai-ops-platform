"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/fields";
import type { Role } from "@/lib/auth/roles";
import type { TaskView } from "@/lib/data/types";
import { TASK_STATUSES } from "@/lib/schemas/directory";
import { ReturnTaskModal } from "./ReturnTaskModal";
import { TaskFormModal, type AssigneeOption } from "./TaskFormModal";
import {
  DueCell,
  PriorityBadge,
  StatusBadge,
  TaskActions,
  TaskTitleCell,
  useTaskActions,
} from "./shared";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

type Dialog =
  | { kind: "form"; task: TaskView | null }
  | { kind: "delete"; task: TaskView }
  | { kind: "return"; task: TaskView }
  | null;

export function TasksView({
  tasks,
  assignees,
  role,
  today,
}: {
  tasks: TaskView[];
  assignees: AssigneeOption[];
  role: Role;
  today: string;
}) {
  const t = useTranslations("tasks");
  const tStatus = useTranslations("tasks.status");
  const { advance, remove } = useTaskActions();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () => (status === "all" ? tasks : tasks.filter((task) => task.status === status)),
    [tasks, status],
  );
  const canCreate = role !== "employee";
  const close = () => setDialog(null);

  const columns: Column<TaskView>[] = [
    {
      id: "title",
      header: t("columns.task"),
      sortValue: (task) => task.title,
      cell: (task) => <TaskTitleCell task={task} />,
    },
    ...(role === "employee"
      ? []
      : [
          {
            id: "assignee",
            header: t("columns.assignee"),
            showFrom: "md" as const,
            sortValue: (task: TaskView) => task.assigneeName,
            cell: (task: TaskView) => task.assigneeName,
          },
        ]),
    {
      id: "priority",
      header: t("columns.priority"),
      showFrom: "lg",
      sortValue: (task) => PRIORITY_ORDER[task.priority],
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
      id: "status",
      header: t("columns.status"),
      sortValue: (task) => TASK_STATUSES.indexOf(task.status),
      cell: (task) => <StatusBadge status={task.status} />,
    },
    {
      id: "actions",
      header: t("columns.actions"),
      hiddenHeader: true,
      mobileInline: true,
      cell: (task) => (
        <TaskActions
          task={task}
          onAdvance={advance}
          onReturn={(item) => setDialog({ kind: "return", task: item })}
          onEdit={(item) => setDialog({ kind: "form", task: item })}
          onDelete={(item) => setDialog({ kind: "delete", task: item })}
        />
      ),
    },
  ];

  const addButton = canCreate ? (
    <Button size="sm" onClick={() => setDialog({ kind: "form", task: null })}>
      <PlusOutlined aria-hidden="true" />
      {t("add")}
    </Button>
  ) : null;

  return (
    <>
      <DataTable
        caption={t("caption")}
        rows={rows}
        columns={columns}
        getRowId={(task) => task.id}
        searchText={(task) => `${task.title} ${task.description} ${task.assigneeName}`}
        initialSort={{ id: "due", dir: "asc" }}
        filters={
          <FilterSelect label={t("filters.status")} value={status} onChange={setStatus}>
            <option value="all">{t("filters.all")}</option>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </FilterSelect>
        }
        actions={addButton}
        empty={{
          title: t(status === "all" ? "empty.title" : "empty.filtered"),
          text: status === "all" ? t(`empty.text.${role}`) : undefined,
          action: status === "all" ? (addButton ?? undefined) : undefined,
        }}
      />

      <TaskFormModal
        open={dialog?.kind === "form"}
        onClose={close}
        editing={dialog?.kind === "form" ? dialog.task : null}
        assignees={assignees}
        today={today}
      />
      <ReturnTaskModal
        task={dialog?.kind === "return" ? dialog.task : null}
        onClose={close}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onClose={close}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteText", {
          title: dialog?.kind === "delete" ? dialog.task.title : "",
        })}
        confirmLabel={t("confirm.deleteConfirm")}
        onConfirm={async () => {
          if (dialog?.kind === "delete") await remove(dialog.task);
        }}
      />
    </>
  );
}
