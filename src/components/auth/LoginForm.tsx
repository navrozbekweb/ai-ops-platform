"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Link } from "@/i18n/navigation";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";
import { safeInternalPath } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export type DemoAccount = {
  role: "admin" | "manager" | "employee";
  email: string;
  password: string;
};

export function LoginForm({ demoAccounts }: { demoAccounts: DemoAccount[] | null }) {
  const t = useTranslations("auth");
  const tRoles = useTranslations("roles");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", locale: locale as LoginInput["locale"] },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok: boolean;
        error?: string;
        redirectTo?: string;
      } | null;

      if (response.ok && data?.ok && data.redirectTo) {
        const next = safeInternalPath(searchParams.get("next"));
        const target = next && next.startsWith(`/${locale}/`) ? next : data.redirectTo;
        router.replace(target);
        router.refresh();
        return;
      }
      if (response.status === 401) setServerError(t("login.errors.invalid"));
      else if (response.status === 429) setServerError(t("login.errors.rateLimited"));
      else if (response.status === 503) setServerError(t("login.errors.disabled"));
      else setServerError(t("login.errors.generic"));
    } catch {
      setServerError(t("login.errors.generic"));
    }
  });

  const fieldError = (key?: string) => (key ? t(`validation.${key}`) : undefined);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          id="login-email"
          label={t("login.email")}
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder={t("login.emailPlaceholder")}
          error={fieldError(errors.email?.message)}
          {...register("email")}
        />
        <TextField
          id="login-password"
          label={t("login.password")}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder={t("login.passwordPlaceholder")}
          error={fieldError(errors.password?.message)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? tc("hidePassword") : tc("showPassword")}
              className="flex size-11 items-center justify-center rounded-full text-white/80 hover:text-white"
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          }
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm font-medium text-blue-200 hover:text-white"
          >
            {t("login.forgot")}
          </Link>
        </div>

        {serverError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-100"
          >
            {serverError}
          </p>
        ) : null}

        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      {demoAccounts ? (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
          <p className="text-sm font-semibold">{t("login.demoTitle")}</p>
          <p className="mb-3 text-xs text-white/70">{t("login.demoHint")}</p>
          <ul className="flex flex-col gap-2">
            {demoAccounts.map((account) => (
              <li key={account.role}>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", account.email, { shouldValidate: true });
                    setValue("password", account.password, { shouldValidate: true });
                  }}
                  className="flex min-h-11 w-full flex-wrap items-center justify-between gap-x-3 rounded-xl border border-white/15 px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  <span className="font-medium">{tRoles(account.role)}</span>
                  <span className="text-white/75">{account.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
