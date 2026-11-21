"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Oddiy, klaviatura bilan ishlaydigan pop-over. Escape yopadi va fokusni tugmaga qaytaradi,
 * tashqariga bosish yoki Tab bilan chiqish ham yopadi. Telefonda panel ekran kengligiga cho'ziladi.
 */
export function Popover({
  label,
  trigger,
  triggerClassName = "",
  panelClassName = "",
  children,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        className={`focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 ${triggerClassName}`}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={panel}
          id={id}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={`border-border bg-surface text-text fixed inset-x-4 top-[4.5rem] z-40 rounded-xl border shadow-xl outline-none sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-88 ${panelClassName}`}
        >
          <Slot render={children} close={close} />
        </div>
      ) : null}
    </div>
  );
}

/** Render-prop'ni alohida komponentda chaqiradi: `close` shu yerda oddiy prop bo'lib keladi. */
function Slot({
  render,
  close,
}: {
  render: (close: () => void) => ReactNode;
  close: () => void;
}) {
  return <>{render(close)}</>;
}
