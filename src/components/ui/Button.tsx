import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "glass";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-blue-700 focus-visible:outline-blue-300",
  ghost: "border border-border bg-surface text-text hover:bg-surface-2",
  glass: "bg-white text-slate-900 hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
