"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { CloseOutlined } from "@ant-design/icons";

type Tone = "success" | "error";
type Item = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{
  show: (message: string, tone?: Tone) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return ctx;
}

/** Qisqa xabarlar. Ekran o'qish dasturlari `aria-live` orqali o'qib beradi, 5 soniyadan keyin yo'qoladi. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("ui");
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      seq.current += 1;
      const id = seq.current;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`border-border bg-surface text-text pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 p-3 text-sm shadow-lg ${
              item.tone === "success" ? "border-l-green-600" : "border-l-red-600"
            }`}
          >
            <p className="min-w-0 flex-1 py-1">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={t("close")}
              className="text-muted hover:bg-surface-2 focus-visible:outline-accent flex size-8 shrink-0 items-center justify-center rounded-md focus-visible:outline-2"
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
