"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { api, formatDate, useApiErrorText } from "@/lib/client/api";
import type { TaskView } from "@/lib/data/types";
import type { Priority, TaskStatus } from "@/lib/schemas/directory";

const STATUS_TONE: Record<TaskStatus, Tone> = {
  todo: "neutral",
  in_progress: "info",
  review: "warning",
  done: "success",
};
const PRIORITY_TONE: Record<Priority, Tone> = {
  low: "neutral",
  medium: "info",
  high: "danger",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const t = useTranslations("tasks.status");
  return <Badge tone={STATUS_TONE[status]}>{t(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations("tasks.priority");
  return <Badge tone={PRIORITY_TONE[priority]}>{t(priority)}</Badge>;
}

export function TaskTitleCell({ task }: { task: TaskView }) {
  const t = useTranslations("tasks");
  return (
    <div className="flex min-w-48 flex-col gap-0.5">
      <span className="font-medium">{task.title}</span>
      {task.description ? (
        <span className="text-muted line-clamp-1 text-xs">{task.description}</span>
      ) : null}
      {task.note && task.status === "in_progress" ? (
        <span className="text-warning text-xs">
          {t("returnedNote", { note: task.note })}
        </span>
      ) : null}
    </div>
  );
}

export function DueCell({ task, today }: { task: TaskView; today: string }) {
  const t = useTranslations("tasks");
  const overdue = task.status !== "done" && task.due < today;
  return (
    <div className="flex flex-col items-start gap-1 whitespace-nowrap">
      <span>{formatDate(task.due)}</span>
      {overdue ? <Badge tone="danger">{t("overdue")}</Badge> : null}
    </div>
  );
}

/** Holat o'zgartirish (server ruxsatni tekshiradi, bu yerda faqat natija ko'rsatiladi). */
export function useTaskActions() {
  const router = useRouter();
  const toast = useToast();
  const tStatus = useTranslations("tasks.status");
  const t = useTranslations("tasks");
  const apiError = useApiErrorText();

  const advance = async (task: TaskView, status: TaskStatus) => {
    try {
      await api(`/api/tasks/${task.id}`, { method: "PATCH", body: { status } });
      toast.show(t("toast.moved", { status: tStatus(status) }));
      router.refresh();
    } catch (error) {
      toast.show(apiError(error), "error");
    }
  };

  const remove = async (task: TaskView) => {
    try {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
    } catch (error) {
      throw new Error(apiError(error));
    }
    toast.show(t("toast.deleted"));
    router.refresh();
  };

  return { advance, remove };
}

/** Qatordagi amallar: faqat serverning `can` javobida ruxsat berilganlari chiqadi. */
export function TaskActions({
  task,
  onAdvance,
  onReturn,
  onEdit,
  onDelete,
}: {
  task: TaskView;
  onAdvance: (task: TaskView, status: TaskStatus) => void;
  onReturn: (task: TaskView) => void;
  onEdit?: (task: TaskView) => void;
  onDelete?: (task: TaskView) => void;
}) {
  const t = useTranslations("tasks");
  const label = (action: string) => t("aria", { action, title: task.title });

  const moves = task.can.advance.map((next) => {
    if (task.status === "todo" && next === "in_progress")
      return { key: "start", next, primary: true };
    if (task.status === "in_progress" && next === "todo")
      return { key: "back", next, primary: false };
    if (task.status === "in_progress" && next === "review")
      return { key: "submit", next, primary: true };
    if (task.status === "review" && next === "done")
      return { key: "approve", next, primary: true };
    return { key: "return", next, primary: false };
  });

  return (
    <div className="flex justify-end gap-1.5 whitespace-nowrap">
      {moves.map(({ key, next, primary }) => (
        <Button
          key={key}
          size="sm"
          variant={primary ? "primary" : "ghost"}
          aria-label={label(t(`actions.${key}`))}
          onClick={() => (key === "return" ? onReturn(task) : onAdvance(task, next))}
        >
          {t(`actions.${key}`)}
        </Button>
      ))}
      {task.can.manage && onEdit ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={label(t("actions.edit"))}
          onClick={() => onEdit(task)}
        >
          {t("actions.edit")}
        </Button>
      ) : null}
      {task.can.manage && onDelete ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={label(t("actions.delete"))}
          onClick={() => onDelete(task)}
        >
          {t("actions.delete")}
        </Button>
      ) : null}
    </div>
  );
}
