"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api, useApiErrorText } from "@/lib/client/api";
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeInput,
  type ProfileInput,
} from "@/lib/schemas/sections";

type ProfileData = {
  name: string;
  email: string;
  roleLabel: string;
  dept: string;
  managerName: string | null;
};

const card = "border-border bg-surface flex flex-col gap-4 rounded-xl border p-5";

export function ProfileView({ profile }: { profile: ProfileData }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <DetailsForm profile={profile} />
      <PasswordForm />
    </div>
  );
}

function DetailsForm({ profile }: { profile: ProfileData }) {
  const t = useTranslations("profile.details");
  const tv = useTranslations("forms.validation");
  const apiError = useApiErrorText();
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/profile", { method: "PATCH", body: values });
      toast.show(t("saved"));
      router.refresh();
    } catch (error) {
      setFormError(apiError(error));
    }
  });

  return (
    <section aria-labelledby="profile-details" className={card}>
      <h2 id="profile-details" className="text-base font-semibold">
        {t("title")}
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          label={t("name")}
          required
          autoComplete="name"
          error={errors.name?.message ? tv(errors.name.message) : undefined}
          {...register("name")}
        />
        <InputField
          label={t("email")}
          type="email"
          value={profile.email}
          readOnly
          disabled
          hint={t("emailLocked")}
        />
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted text-xs">{t("role")}</dt>
            <dd className="font-medium">{profile.roleLabel}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">{t("dept")}</dt>
            <dd className="font-medium">{profile.dept}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">{t("manager")}</dt>
            <dd className="font-medium">{profile.managerName ?? "-"}</dd>
          </div>
        </dl>
        {formError ? (
          <p role="alert" className="text-danger text-sm">
            {formError}
          </p>
        ) : null}
        <div>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            {t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const t = useTranslations("profile.password");
  const tv = useTranslations("forms.validation");
  const apiError = useApiErrorText();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current: "", password: "", confirm: "" },
  });

  const fieldError = (key?: string) => (key ? tv(key) : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/profile/password", { method: "POST", body: values });
      toast.show(t("success"));
      reset();
    } catch (error) {
      if (error instanceof ApiError && error.code === "wrongPassword") {
        // Xato aynan "Joriy parol" maydoni ostida ko'rinadi.
        setError("current", { type: "server", message: apiError(error) });
      } else {
        setFormError(apiError(error));
      }
    }
  });

  return (
    <section aria-labelledby="profile-password" className={card}>
      <div className="flex flex-col gap-1">
        <h2 id="profile-password" className="text-base font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted text-sm">{t("desc")}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          label={t("current")}
          type="password"
          required
          autoComplete="current-password"
          error={
            errors.current?.type === "server"
              ? errors.current.message
              : fieldError(errors.current?.message)
          }
          {...register("current")}
        />
        <InputField
          label={t("new")}
          type="password"
          required
          autoComplete="new-password"
          hint={t("hint")}
          error={fieldError(errors.password?.message)}
          {...register("password")}
        />
        <InputField
          label={t("confirm")}
          type="password"
          required
          autoComplete="new-password"
          error={fieldError(errors.confirm?.message)}
          {...register("confirm")}
        />
        {formError ? (
          <p role="alert" className="text-danger text-sm">
            {formError}
          </p>
        ) : null}
        <div>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
