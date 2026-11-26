"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlusOutlined } from "@ant-design/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/fields";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/auth/roles";
import { api, useApiErrorText } from "@/lib/client/api";
import type { Person } from "@/lib/data/types";
import { UserFormModal } from "./UserFormModal";

type Dialog =
  | { kind: "form"; person: Person | null }
  | { kind: "block"; person: Person }
  | { kind: "delete"; person: Person }
  | null;

const ROLE_TONE = { admin: "danger", manager: "info", employee: "neutral" } as const;

export function UsersView({
  people,
  currentUserId,
}: {
  people: Person[];
  currentUserId: string;
}) {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const toast = useToast();
  const apiError = useApiErrorText();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [role, setRole] = useState("all");

  const names = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);
  const managers = useMemo(
    () => people.filter((p) => p.role === "manager" && p.active),
    [people],
  );
  const rows = useMemo(
    () => (role === "all" ? people : people.filter((p) => p.role === role)),
    [people, role],
  );

  const patchActive = async (person: Person, active: boolean) => {
    await api(`/api/users/${person.id}`, { method: "PATCH", body: { active } });
    toast.show(t(active ? "toast.unblocked" : "toast.blocked", { name: person.name }));
    router.refresh();
  };

  const columns: Column<Person>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{p.name}</span>
          <span className="text-muted truncate text-xs">{p.email}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: t("columns.role"),
      sortValue: (p) => p.role,
      cell: (p) => <Badge tone={ROLE_TONE[p.role]}>{tRoles(p.role)}</Badge>,
    },
    {
      id: "dept",
      header: t("columns.dept"),
      showFrom: "md",
      sortValue: (p) => p.dept,
      cell: (p) => p.dept,
    },
    {
      id: "manager",
      header: t("columns.manager"),
      showFrom: "lg",
      sortValue: (p) => (p.managerId ? (names.get(p.managerId) ?? "") : ""),
      cell: (p) =>
        p.managerId ? (
          (names.get(p.managerId) ?? "-")
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      id: "status",
      header: t("columns.status"),
      sortValue: (p) => (p.active ? 0 : 1),
      cell: (p) => (
        <Badge tone={p.active ? "success" : "warning"}>
          {t(p.active ? "status.active" : "status.blocked")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("columns.actions"),
      hiddenHeader: true,
      mobileInline: true,
      className: "text-right",
      cell: (p) => {
        const self = p.id === currentUserId;
        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("actions.edit", { name: p.name })}
              onClick={() => setDialog({ kind: "form", person: p })}
            >
              {t("actions.editShort")}
            </Button>
            {self ? null : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t(p.active ? "actions.block" : "actions.unblock", {
                    name: p.name,
                  })}
                  onClick={() =>
                    p.active
                      ? setDialog({ kind: "block", person: p })
                      : patchActive(p, true).catch((e) =>
                          toast.show(apiError(e), "error"),
                        )
                  }
                >
                  {t(p.active ? "actions.blockShort" : "actions.unblockShort")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("actions.delete", { name: p.name })}
                  onClick={() => setDialog({ kind: "delete", person: p })}
                >
                  {t("actions.deleteShort")}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const close = () => setDialog(null);
  const target = dialog && dialog.kind !== "form" ? dialog.person : null;

  return (
    <>
      <DataTable
        caption={t("caption")}
        rows={rows}
        columns={columns}
        getRowId={(p) => p.id}
        searchText={(p) => `${p.name} ${p.email} ${p.dept}`}
        initialSort={{ id: "name", dir: "asc" }}
        filters={
          <FilterSelect label={t("filters.role")} value={role} onChange={setRole}>
            <option value="all">{t("filters.all")}</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {tRoles(value)}
              </option>
            ))}
          </FilterSelect>
        }
        actions={
          <Button size="sm" onClick={() => setDialog({ kind: "form", person: null })}>
            <PlusOutlined aria-hidden="true" />
            {t("add")}
          </Button>
        }
        empty={{
          title: t("empty.title"),
          text: t("empty.text"),
          action: (
            <Button size="sm" onClick={() => setDialog({ kind: "form", person: null })}>
              {t("add")}
            </Button>
          ),
        }}
      />

      <UserFormModal
        open={dialog?.kind === "form"}
        onClose={close}
        editing={dialog?.kind === "form" ? dialog.person : null}
        managers={managers}
      />

      <ConfirmDialog
        open={dialog?.kind === "block"}
        onClose={close}
        title={t("confirm.blockTitle")}
        message={t("confirm.blockText", { name: target?.name ?? "" })}
        confirmLabel={t("confirm.blockConfirm")}
        onConfirm={async () => {
          if (target)
            await patchActive(target, false).catch((e) => {
              throw new Error(apiError(e));
            });
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onClose={close}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteText", { name: target?.name ?? "" })}
        confirmLabel={t("confirm.deleteConfirm")}
        onConfirm={async () => {
          if (!target) return;
          try {
            await api(`/api/users/${target.id}`, { method: "DELETE" });
          } catch (error) {
            throw new Error(apiError(error));
          }
          toast.show(t("toast.deleted", { name: target.name }));
          router.refresh();
        }}
      />
    </>
  );
}
