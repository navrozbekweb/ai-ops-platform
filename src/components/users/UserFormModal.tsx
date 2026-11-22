"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/auth/roles";
import { ApiError, api, useApiErrorText } from "@/lib/client/api";
import type { Person } from "@/lib/data/types";
import { userCreateSchema, type UserCreateInput } from "@/lib/schemas/directory";

/** Foydalanuvchi qo'shish / tahrirlash. Tahrirlashda email o'zgarmaydi (hisob identifikatori). */
export function UserFormModal({
  open,
  onClose,
  editing,
  managers,
}: {
  open: boolean;
  onClose: () => void;
  editing: Person | null;
  managers: Pick<Person, "id" | "name">[];
}) {
  return (
    <FormShell open={open} onClose={onClose} editing={editing} managers={managers} />
  );
}

function FormShell({
  open,
  onClose,
  editing,
  managers,
}: {
  open: boolean;
  onClose: () => void;
  editing: Person | null;
  managers: Pick<Person, "id" | "name">[];
}) {
  const t = useTranslations("users.form");
  const tRoles = useTranslations("roles");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t("editTitle") : t("createTitle")}
      description={editing ? t("editDesc") : t("createDesc")}
    >
      <UserForm
        // Boshqa foydalanuvchi tanlanganda forma toza qayta quriladi.
        key={editing?.id ?? "new"}
        editing={editing}
        managers={managers}
        onDone={onClose}
        roleLabel={(role) => tRoles(role)}
      />
    </Modal>
  );
}

function UserForm({
  editing,
  managers,
  onDone,
  roleLabel,
}: {
  editing: Person | null;
  managers: Pick<Person, "id" | "name">[];
  onDone: () => void;
  roleLabel: (role: (typeof ROLES)[number]) => string;
}) {
  const t = useTranslations("users");
  const tv = useTranslations("forms.validation");
  const tu = useTranslations("ui");
  const apiError = useApiErrorText();
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      name: editing?.name ?? "",
      email: editing?.email ?? "",
      role: editing?.role ?? "employee",
      dept: editing?.dept ?? "",
      managerId: editing?.managerId ?? "",
    },
  });
  const role = useWatch({ control, name: "role" });

  const fieldError = (key?: string) => (key ? tv(key) : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const managerId =
      values.role === "employee" && values.managerId ? values.managerId : null;
    try {
      if (editing) {
        await api(`/api/users/${editing.id}`, {
          method: "PATCH",
          body: { name: values.name, role: values.role, dept: values.dept, managerId },
        });
        toast.show(t("toast.updated", { name: values.name }));
      } else {
        await api("/api/users", { method: "POST", body: { ...values, managerId } });
        toast.show(t("toast.created", { name: values.name }));
      }
      router.refresh();
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.code === "emailTaken") {
        setError("email", { message: "emailTaken" });
      } else {
        setFormError(apiError(error));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 pb-2">
      <InputField
        label={t("form.name")}
        required
        autoComplete="off"
        data-autofocus
        error={fieldError(errors.name?.message)}
        {...register("name")}
      />
      <InputField
        label={t("form.email")}
        type="email"
        required
        autoComplete="off"
        disabled={Boolean(editing)}
        hint={editing ? t("form.emailLocked") : t("form.inviteNote")}
        error={fieldError(errors.email?.message)}
        {...register("email")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t("form.role")}
          required
          error={fieldError(errors.role?.message)}
          {...register("role")}
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {roleLabel(value)}
            </option>
          ))}
        </SelectField>
        <InputField
          label={t("form.dept")}
          required
          autoComplete="off"
          error={fieldError(errors.dept?.message)}
          {...register("dept")}
        />
      </div>
      {role === "employee" ? (
        <SelectField
          label={t("form.manager")}
          hint={t("form.managerHint")}
          error={fieldError(errors.managerId?.message)}
          {...register("managerId")}
        >
          <option value="">{t("form.managerNone")}</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
        </SelectField>
      ) : null}

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
