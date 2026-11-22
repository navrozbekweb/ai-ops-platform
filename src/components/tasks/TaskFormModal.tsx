"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField, TextareaField } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, useApiErrorText } from "@/lib/client/api";
import type { TaskView } from "@/lib/data/types";
import {
  PRIORITIES,
  taskCreateSchema,
  type TaskCreateInput,
} from "@/lib/schemas/directory";

export type AssigneeOption = { id: string; name: string };

function plusDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Vazifa yaratish / tahrirlash. Server tayinlash huquqini qayta tekshiradi. */
export function TaskFormModal({
  open,
  onClose,
  editing,
  assignees,
  defaultAssigneeId,
  today,
}: {
  open: boolean;
  onClose: () => void;
  editing: TaskView | null;
  assignees: AssigneeOption[];
  defaultAssigneeId?: string;
  today: string;
}) {
  const t = useTranslations("tasks.form");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t("editTitle") : t("createTitle")}
      description={editing ? t("editDesc") : t("createDesc")}
    >
      <TaskForm
        key={editing?.id ?? `new-${defaultAssigneeId ?? ""}`}
        editing={editing}
        assignees={assignees}
        defaultAssigneeId={defaultAssigneeId}
        today={today}
        onDone={onClose}
      />
    </Modal>
  );
}

function TaskForm({
  editing,
  assignees,
  defaultAssigneeId,
  today,
  onDone,
}: {
  editing: TaskView | null;
  assignees: AssigneeOption[];
  defaultAssigneeId?: string;
  today: string;
  onDone: () => void;
}) {
  const t = useTranslations("tasks");
  const tv = useTranslations("forms.validation");
  const tu = useTranslations("ui");
  const tp = useTranslations("tasks.priority");
  const apiError = useApiErrorText();
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  // Tahrirlanayotgan vazifaning hozirgi ijrochisi ro'yxatda bo'lmasa ham tanlov yo'qolmasin.
  const options =
    editing && !assignees.some((a) => a.id === editing.assigneeId)
      ? [{ id: editing.assigneeId, name: editing.assigneeName }, ...assignees]
      : assignees;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: editing?.title ?? "",
      description: editing?.description ?? "",
      assigneeId: editing?.assigneeId ?? defaultAssigneeId ?? "",
      priority: editing?.priority ?? "medium",
      due: editing?.due ?? plusDays(today, 7),
    },
  });

  const fieldError = (key?: string) => (key ? tv(key) : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (editing) {
        await api(`/api/tasks/${editing.id}`, { method: "PATCH", body: values });
        toast.show(t("toast.updated"));
      } else {
        await api("/api/tasks", { method: "POST", body: values });
        toast.show(t("toast.created"));
      }
      router.refresh();
      onDone();
    } catch (error) {
      setFormError(apiError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 pb-2">
      <InputField
        label={t("form.title")}
        required
        autoComplete="off"
        data-autofocus
        error={fieldError(errors.title?.message)}
        {...register("title")}
      />
      <TextareaField
        label={t("form.description")}
        error={fieldError(errors.description?.message)}
        {...register("description")}
      />
      <SelectField
        label={t("form.assignee")}
        required
        error={fieldError(errors.assigneeId?.message)}
        {...register("assigneeId")}
      >
        <option value="">{t("form.assigneePlaceholder")}</option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t("form.priority")}
          required
          error={fieldError(errors.priority?.message)}
          {...register("priority")}
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {tp(value)}
            </option>
          ))}
        </SelectField>
        <InputField
          label={t("form.due")}
          type="date"
          required
          error={fieldError(errors.due?.message)}
          {...register("due")}
        />
      </div>

      {formError ? (
        <p role="alert" className="text-danger text-sm">
          {formError}
        </p>
      ) : null}

      <div className="border-border -mx-6 mt-2 flex flex-col-reverse gap-2 border-t px-6 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDone}
          disabled={isSubmitting}
        >
          {tu("cancel")}
        </Button>
        <Button type="submit" size="sm" loading={isSubmitting}>
          {editing ? t("form.submitEdit") : t("form.submitCreate")}
        </Button>
      </div>
    </form>
  );
}
