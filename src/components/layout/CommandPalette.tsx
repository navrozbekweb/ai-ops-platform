"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import {
  DesktopOutlined,
  LogoutOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useRouter } from "@/i18n/navigation";
import { useTheme } from "@/components/providers/AppProviders";
import { navItemsFor, type Role, type Section } from "@/lib/auth/roles";
import { NavIcon } from "./nav-icons";

type Entry = {
  id: string;
  group: "pages" | "actions";
  label: string;
  icon: ReactNode;
  run: () => void;
};

/**
 * Tezkor qidiruv (Ctrl/Cmd + K). Brauzerning o'z <dialog> elementi ishlatiladi:
 * fokus ushlab turiladi, Escape yopadi, orqa fon bosilmaydi. Faqat rolga ruxsat etilgan
 * sahifalar ko'rsatiladi.
 */
export function CommandPalette({
  open,
  onOpenChange,
  role,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onLogout: () => void;
}) {
  const t = useTranslations();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={t("palette.title")}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className="border-border bg-surface text-text mt-[12vh] mr-auto mb-auto ml-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50"
    >
      {open ? (
        <PaletteBody role={role} onLogout={onLogout} close={() => onOpenChange(false)} />
      ) : null}
    </dialog>
  );
}

function PaletteBody({
  role,
  onLogout,
  close,
}: {
  role: Role;
  onLogout: () => void;
  close: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { setPreference } = useTheme();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const sections: readonly Section[] = [...navItemsFor(role), "profile"];
  const entries: Entry[] = [
    ...sections.map<Entry>((section) => ({
      id: `page-${section}`,
      group: "pages",
      label: t(`nav.${section}`),
      icon: <NavIcon section={section} />,
      run: () => router.push(`/${section}`),
    })),
    {
      id: "action-light",
      group: "actions",
      label: t("palette.actionLight"),
      icon: <SunOutlined />,
      run: () => setPreference("light"),
    },
    {
      id: "action-dark",
      group: "actions",
      label: t("palette.actionDark"),
      icon: <MoonOutlined />,
      run: () => setPreference("dark"),
    },
    {
      id: "action-system",
      group: "actions",
      label: t("palette.actionSystem"),
      icon: <DesktopOutlined />,
      run: () => setPreference("system"),
    },
    {
      id: "action-logout",
      group: "actions",
      label: t("palette.actionLogout"),
      icon: <LogoutOutlined />,
      run: onLogout,
    },
  ];

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? entries.filter((e) => e.label.toLowerCase().includes(needle))
    : entries;
  const active = Math.min(index, Math.max(visible.length - 1, 0));
  const activeId = visible[active]?.id;

  function choose(entry: Entry | undefined) {
    if (!entry) return;
    close();
    entry.run();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex(visible.length ? (active + 1) % visible.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex(visible.length ? (active - 1 + visible.length) % visible.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(visible[active]);
    }
  }

  const groups = (["pages", "actions"] as const)
    .map((group) => ({ group, rows: visible.filter((entry) => entry.group === group) }))
    .filter(({ rows }) => rows.length > 0);

  return (
    <div className="flex flex-col">
      <div className="border-border flex items-center gap-3 border-b px-4">
        <SearchOutlined aria-hidden="true" className="text-muted" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label={t("palette.title")}
          placeholder={t("palette.placeholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-current/50"
        />
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={t("palette.title")}
        className="max-h-80 overflow-y-auto p-2"
      >
        {groups.length === 0 ? (
          <p role="status" className="text-muted px-3 py-6 text-center text-sm">
            {t("palette.empty")}
          </p>
        ) : (
          groups.map(({ group, rows }) => (
            <div
              key={group}
              role="group"
              aria-label={t(`palette.${group}`)}
              className="mb-1"
            >
              <p
                aria-hidden="true"
                className="text-muted px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase"
              >
                {t(`palette.${group}`)}
              </p>
              {rows.map((entry) => {
                const selected = entry.id === activeId;
                return (
                  <div
                    key={entry.id}
                    id={entry.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(entry)}
                    onMouseMove={() => setIndex(visible.indexOf(entry))}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                      selected ? "bg-accent text-white" : ""
                    }`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {entry.icon}
                    </span>
                    {entry.label}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <p className="border-border text-muted border-t px-4 py-2.5 text-xs">
        {t("palette.hint")}
      </p>
    </div>
  );
}
