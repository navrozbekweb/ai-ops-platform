import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "glass" | "danger";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-blue-700 focus-visible:outline-blue-300",
  ghost: "border border-border bg-surface text-text hover:bg-surface-2",
  glass: "bg-white text-slate-900 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-400",
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-6",
  sm: "h-10 px-4",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
