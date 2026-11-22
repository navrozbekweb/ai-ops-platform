import type { ReactNode } from "react";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  info: "bg-accent/10 text-accent-text border-accent/30",
  success:
    "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success border-[color-mix(in_srgb,var(--success)_30%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning border-[color-mix(in_srgb,var(--warning)_30%,transparent)]",
  danger:
    "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger border-[color-mix(in_srgb,var(--danger)_30%,transparent)]",
};

/** Holat belgisi. Ma'no rangga emas, matnga tayanadi (rang ko'rmaydiganlar uchun ham tushunarli). */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
