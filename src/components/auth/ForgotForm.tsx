"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { forgotSchema, type ForgotInput } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "", locale: locale as ForgotInput["locale"] },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok: boolean;
        demoLink?: string;
      } | null;
      if (response.ok && data?.ok) {
        setSent(true);
        setDemoLink(data.demoLink ?? null);
        return;
      }
      setServerError(
        response.status === 429
          ? t("login.errors.rateLimited")
          : t("login.errors.generic"),
      );
    } catch {
      setServerError(t("login.errors.generic"));
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-3 text-sm"
        >
          {t("forgot.sent")}
        </p>
        {demoLink ? (
          <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-sm">
            <p className="mb-2 text-white/75">{t("forgot.demoLink")}</p>
            <a
              href={demoLink}
              className="inline-flex min-h-11 items-center font-medium text-blue-200 underline hover:text-white"
            >
              {t("forgot.demoOpen")}
            </a>
          </div>
        ) : null}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-medium text-blue-200 hover:text-white"
        >
          {t("forgot.back")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        id="forgot-email"
        label={t("login.email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder={t("login.emailPlaceholder")}
        error={
          errors.email?.message ? t(`validation.${errors.email.message}`) : undefined
        }
        {...register("email")}
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
        {isSubmitting ? t("forgot.submitting") : t("forgot.submit")}
      </Button>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-blue-200 hover:text-white"
      >
        {t("forgot.back")}
      </Link>
    </form>
  );
}
