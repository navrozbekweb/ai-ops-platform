"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resetSchema, type ResetInput } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

type Status = "idle" | "done" | "invalid";

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token, password: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) return setStatus("done");
      if (response.status === 400) return setStatus("invalid");
      setServerError(
        response.status === 429
          ? t("login.errors.rateLimited")
          : t("login.errors.generic"),
      );
    } catch {
      setServerError(t("login.errors.generic"));
    }
  });

  if (status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-3 text-sm"
        >
          {t("reset.success")}
        </p>
        <Link
          href="/login"
          className="bg-accent inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("reset.toLogin")}
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="alert"
          className="rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-3 text-sm text-red-100"
        >
          {t("reset.invalidToken")}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          {t("reset.requestNew")}
        </Link>
      </div>
    );
  }

  const err = (key?: string) => (key ? t(`validation.${key}`) : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" {...register("token")} />
      <TextField
        id="reset-password"
        label={t("reset.password")}
        type="password"
        autoComplete="new-password"
        error={err(errors.password?.message)}
        {...register("password")}
      />
      <TextField
        id="reset-confirm"
        label={t("reset.confirm")}
        type="password"
        autoComplete="new-password"
        error={err(errors.confirm?.message)}
        {...register("confirm")}
      />
      {serverError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-100"
        >
          {serverError}
        </p>
      ) : null}
      <Button type="submit" loading={isSubmitting}>
        {isSubmitting ? t("reset.submitting") : t("reset.submit")}
      </Button>
    </form>
  );
}
