"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CheckboxField, InputField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/Toast";
import { api, useApiErrorText } from "@/lib/client/api";
import type { Settings } from "@/lib/data/types";
import { settingsSchema, type SettingsInput } from "@/lib/schemas/sections";

export function SettingsForm({ settings }: { settings: Settings }) {
  const t = useTranslations("settings");
  const tv = useTranslations("forms.validation");
  const apiError = useApiErrorText();
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/settings", { method: "PATCH", body: values });
      toast.show(t("saved"));
      reset(values);
      router.refresh();
    } catch (error) {
      setFormError(apiError(error));
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border-border bg-surface flex max-w-2xl flex-col gap-4 rounded-xl border p-5"
    >
      <InputField
        label={t("company")}
        required
        autoComplete="organization"
        hint={t("companyHint")}
        error={errors.companyName?.message ? tv(errors.companyName.message) : undefined}
        {...register("companyName")}
      />
      <CheckboxField
        label={t("aiEnabled")}
        hint={t("aiHint")}
        {...register("aiEnabled")}
      />
      <CheckboxField
        label={t("emailNotifications")}
        hint={t("emailHint")}
        {...register("emailNotifications")}
      />
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
  );
}
