"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, useApiErrorText } from "@/lib/client/api";
import {
  DOC_CATEGORIES,
  docCreateSchema,
  type DocCreateInput,
} from "@/lib/schemas/sections";

export function DocFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("documents.form");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("createTitle")}
      description={t("createDesc")}
    >
      <DocForm onDone={onClose} />
    </Modal>
  );
}

function DocForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("documents");
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
  } = useForm<DocCreateInput>({
    resolver: zodResolver(docCreateSchema),
    defaultValues: { title: "", category: "report", description: "", shared: false },
  });
  const fieldError = (key?: string) => (key ? tv(key) : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/docs", { method: "POST", body: values });
      toast.show(t("toast.created"));
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
      <SelectField
        label={t("form.category")}
        required
        error={fieldError(errors.category?.message)}
        {...register("category")}
      >
        {DOC_CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {t(`category.${value}`)}
          </option>
        ))}
      </SelectField>
      <TextareaField
        label={t("form.description")}
        error={fieldError(errors.description?.message)}
        {...register("description")}
      />
      <CheckboxField
        label={t("form.shared")}
        hint={t("form.sharedHint")}
        {...register("shared")}
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
          {t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
