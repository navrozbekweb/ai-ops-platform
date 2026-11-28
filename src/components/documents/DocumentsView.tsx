"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/fields";
import { useToast } from "@/components/ui/Toast";
import { api, formatDate, useApiErrorText } from "@/lib/client/api";
import type { DocView } from "@/lib/data/types";
import { formatBytes } from "@/lib/schemas/files";
import { DOC_CATEGORIES } from "@/lib/schemas/sections";
import { DocFormModal } from "./DocFormModal";

export function DocumentsView({ docs }: { docs: DocView[] }) {
  const t = useTranslations("documents");
  const router = useRouter();
  const toast = useToast();
  const apiError = useApiErrorText();
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<DocView | null>(null);
  const [category, setCategory] = useState("all");

  const rows = useMemo(
    () => (category === "all" ? docs : docs.filter((d) => d.category === category)),
    [docs, category],
  );

  const columns: Column<DocView>[] = [
    {
      id: "title",
      header: t("columns.title"),
      sortValue: (d) => d.title,
      cell: (d) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{d.title}</span>
          {d.description ? (
            <span className="text-muted line-clamp-1 text-xs">{d.description}</span>
          ) : null}
          {d.file ? (
            <span className="text-muted line-clamp-1 text-xs">
              {t("fileMeta", { name: d.file.name, size: formatBytes(d.file.size) })}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: t("columns.category"),
      showFrom: "md",
      sortValue: (d) => d.category,
      cell: (d) => <Badge tone="info">{t(`category.${d.category}`)}</Badge>,
    },
    {
      id: "owner",
      header: t("columns.owner"),
      showFrom: "lg",
      sortValue: (d) => d.ownerName,
      cell: (d) => d.ownerName,
    },
    {
      id: "updated",
      header: t("columns.updated"),
      showFrom: "md",
      sortValue: (d) => d.updatedAt,
      cell: (d) => formatDate(d.updatedAt.slice(0, 10)),
    },
    {
      id: "access",
      header: t("columns.access"),
      sortValue: (d) => (d.shared ? 0 : 1),
      cell: (d) => (
        <Badge tone={d.shared ? "success" : "neutral"}>
          {t(d.shared ? "access.shared" : "access.private")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("columns.actions"),
      hiddenHeader: true,
      mobileInline: true,
      className: "text-right",
      cell: (d) => (
        <div className="flex items-center justify-end gap-1">
          {d.file ? (
            <a
              href={`/api/docs/${d.id}/file`}
              download
              aria-label={t("downloadAria", { title: d.title })}
              className="text-accent hover:bg-surface-2 focus-visible:outline-accent inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <DownloadOutlined aria-hidden="true" />
              {t("download")}
            </a>
          ) : null}
          {d.canDelete ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("deleteAria", { title: d.title })}
              onClick={() => setRemoving(d)}
            >
              {t("delete")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        caption={t("caption")}
        rows={rows}
        columns={columns}
        getRowId={(d) => d.id}
        searchText={(d) => `${d.title} ${d.description} ${d.ownerName}`}
        initialSort={{ id: "updated", dir: "desc" }}
        filters={
          <FilterSelect
            label={t("filters.category")}
            value={category}
            onChange={setCategory}
          >
            <option value="all">{t("filters.all")}</option>
            {DOC_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`category.${value}`)}
              </option>
            ))}
          </FilterSelect>
        }
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusOutlined aria-hidden="true" />
            {t("add")}
          </Button>
        }
        empty={{
          title: t("empty.title"),
          text: t("empty.text"),
          action: (
            <Button size="sm" onClick={() => setCreating(true)}>
              {t("add")}
            </Button>
          ),
        }}
      />

      <DocFormModal open={creating} onClose={() => setCreating(false)} />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteText", { title: removing?.title ?? "" })}
        confirmLabel={t("confirm.deleteConfirm")}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api(`/api/docs/${removing.id}`, { method: "DELETE" });
          } catch (error) {
            throw new Error(apiError(error));
          }
          toast.show(t("toast.deleted"));
          router.refresh();
        }}
      />
    </>
  );
}
