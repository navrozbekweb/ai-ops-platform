"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/**
 * Panel ichidagi forma maydonlari (React Hook Form `register` bilan ishlaydi).
 * Label, majburiylik belgisi, izoh va xato matni bir joyda; `aria-invalid` va
 * `aria-describedby` avtomatik ulanadi.
 */
type Common = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

const control =
  "w-full rounded-lg border bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60";

function Shell({
  id,
  label,
  error,
  hint,
  required,
  children,
}: Common & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger ml-0.5">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export function InputField({
  label,
  error,
  hint,
  required,
  className = "",
  ref,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...props}
        className={`h-11 ${control} ${error ? "border-red-500" : "border-border"} ${className}`}
      />
    </Shell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className = "",
  ref,
  children,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...props}
        className={`h-11 ${control} ${error ? "border-red-500" : "border-border"} ${className}`}
      >
        {children}
      </select>
    </Shell>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  className = "",
  ref,
  ...props
}: Common &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        ref={ref}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...props}
        className={`min-h-24 resize-y py-2.5 ${control} ${error ? "border-red-500" : "border-border"} ${className}`}
      />
    </Shell>
  );
}

/** Tashqi (RHF'siz) filtr tanlagich: toolbar uchun, ko'rinadigan label bilan. */
export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-muted text-sm whitespace-nowrap">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 ${control} border-border w-auto`}
      >
        {children}
      </select>
    </div>
  );
}
