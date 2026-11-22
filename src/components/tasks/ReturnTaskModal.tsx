"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { TextareaField } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, useApiErrorText } from "@/lib/client/api";
import type { TaskView } from "@/lib/data/types";
import { returnNoteSchema } from "@/lib/schemas/directory";

type Values = { note: string };

/** Tekshiruvdan qaytarish: sabab (izoh) majburiy, xodim uni vazifa ostida ko'radi. */
export function ReturnTaskModal({
  task,
  onClose,
}: {
  task: TaskView | null;
  onClose: () => void;
}) {
  const t = useTranslations("tasks.returnForm");
  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      title={t("title")}
      description={task ? t("desc", { title: task.title }) : undefined}
    >
      {task ? <ReturnForm key={task.id} task={task} onDone={onClose} /> : null}
    </Modal>
  );
}

function ReturnForm({ task, onDone }: { task: TaskView; onDone: () => void }) {
  const t = useTranslations("tasks");
  const tv = useTranslations("forms.validation");
  const tu = useTranslations("ui");
  const apiError = useApiErrorText();
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(returnNoteSchema),
    defaultValues: { note: "" },
  });

  const onSubmit = handleSubmit(async ({ note }) => {
    setFormError(null);
    try {
      await api(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: { status: "in_progress", note },
      });
      toast.show(t("toast.returned"));
      router.refresh();
      onDone();
    } catch (error) {
      setFormError(apiError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 pb-2">
      <TextareaField
        label={t("returnForm.note")}
        required
        data-autofocus
        error={errors.note?.message ? tv(errors.note.message) : undefined}
        {...register("note")}
      />
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
          {t("returnForm.submit")}
        </Button>
      </div>
    </form>
  );
}
