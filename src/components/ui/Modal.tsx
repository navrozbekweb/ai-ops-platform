"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CloseOutlined } from "@ant-design/icons";

const SIZES = { sm: "28rem", md: "36rem", lg: "48rem" } as const;

/**
 * Modal oyna: brauzerning o'z <dialog> elementi ustiga qurilgan. Fokus ichkarida ushlanadi,
 * orqa fon inert bo'ladi, Esc yopadi, yopilganda fokus ochgan tugmaga qaytadi.
 * Ichidagi `data-autofocus` belgili element ochilganda fokus oladi (aks holda birinchi tugma).
 * Ichki mazmun faqat ochiq paytda chiziladi, shuning uchun formalar har safar toza ochiladi.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** false bo'lsa Esc va orqa fonni bosish yopmaydi (masalan, so'rov ketayotganda). */
  dismissible?: boolean;
}) {
  const t = useTranslations("ui");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  // Modal ochiq paytda sahifa orqada aylanmasin.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      style={{ width: `min(${SIZES[size]}, calc(100vw - 1.5rem))` }}
      className="border-border bg-surface text-text m-auto max-h-[calc(100dvh-1.5rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="text-muted text-sm">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!dismissible}
              aria-label={t("close")}
              className="text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-accent -mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 disabled:opacity-50"
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>
          {children ? <div className="overflow-y-auto px-6 py-2">{children}</div> : null}
          {footer ? (
            <div className="border-border flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
