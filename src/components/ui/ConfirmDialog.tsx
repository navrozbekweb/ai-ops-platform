"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Tasdiqlash oynasi (o'chirish, bloklash kabi qaytarib bo'lmaydigan amallar uchun).
 * `onConfirm` xato tashlasa, xabar oynada ko'rsatiladi va oyna ochiq qoladi.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  tone = "danger",
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations("ui");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : t("genericError"));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={!busy}
      size="sm"
      title={title}
      description={message}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            disabled={busy}
            data-autofocus
          >
            {t("cancel")}
          </Button>
          <Button variant={tone} size="sm" onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-danger pb-2 text-sm">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
