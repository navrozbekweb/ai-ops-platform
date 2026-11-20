import type { InputHTMLAttributes, ReactNode, Ref } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

/** Forma maydoni: label + input + xato matni. React Hook Form `register` bilan ishlaydi. */
export function TextField({
  id,
  label,
  error,
  trailing,
  className = "",
  ref,
  ...props
}: Props) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
          className={`h-12 w-full rounded-xl border bg-white/10 px-3.5 text-base text-inherit placeholder:text-current/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-300 ${
            error ? "border-red-400" : "border-current/30"
          } ${trailing ? "pr-12" : ""} ${className}`}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
