"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CaretDownFilled,
  CaretUpFilled,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Berilsa, ustun saralanadi. */
  sortValue?: (row: T) => string | number;
  /** Shu kenglikdan boshlab ko'rinadi (telefonda ikkinchi darajali ustunlar yashiriladi). */
  showFrom?: "md" | "lg";
  /** Sarlavha ko'rinmaydi, lekin ekran o'qish dasturi uchun qoladi (amallar ustuni). */
  hiddenHeader?: boolean;
  /**
   * Amallar kabi ustunlar uchun: telefonda ustun yashiriladi va mazmuni birinchi ustun ichida
   * (matn tagida) ko'rsatiladi, shunda ularni topish uchun jadvalni yon tomonga surish shart emas.
   */
  mobileInline?: boolean;
  className?: string;
};

type Sort = { id: string; dir: "asc" | "desc" };

const SHOW_FROM = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

function columnVisibility<T>(column: Column<T>): string {
  if (column.showFrom) return SHOW_FROM[column.showFrom];
  return column.mobileInline ? SHOW_FROM.md : "";
}

/**
 * Jadval: qidiruv, saralash, sahifalash, bo'sh va yuklanish holatlari. Ma'lumot to'liq brauzerda
 * (mock hajmi uchun yetarli). Haqiqiy backendda katta hajm uchun saralash/sahifalash serverga
 * o'tkaziladi, komponent interfeysi o'zgarmaydi.
 */
export function DataTable<T>({
  caption,
  rows,
  columns,
  getRowId,
  searchText,
  filters,
  actions,
  empty,
  loading = false,
  initialSort,
  pageSizes = [10, 25, 50],
}: {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** Berilsa, qidiruv maydoni chiqadi; funksiya qatorning qidiriladigan matnini qaytaradi. */
  searchText?: (row: T) => string;
  filters?: ReactNode;
  actions?: ReactNode;
  empty: { title: string; text?: string; action?: ReactNode };
  loading?: boolean;
  initialSort?: Sort;
  pageSizes?: number[];
}) {
  const t = useTranslations("table");
  const locale = useLocale();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort | null>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0] ?? 10);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle || !searchText) return rows;
    return rows.filter((row) =>
      searchText(row).toLocaleLowerCase(locale).includes(needle),
    );
  }, [rows, query, searchText, locale]);

  const sorted = useMemo(() => {
    const column = sort ? columns.find((c) => c.id === sort.id) : undefined;
    if (!sort || !column?.sortValue) return filtered;
    const get = column.sortValue;
    const direction = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * direction;
      return (
        String(x).localeCompare(String(y), locale, {
          numeric: true,
          sensitivity: "base",
        }) * direction
      );
    });
  }, [filtered, sort, columns, locale]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (id: string) => {
    setPage(1);
    setSort((previous) => {
      if (previous?.id !== id) return { id, dir: "asc" };
      if (previous.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  };

  const inlineColumns = columns.filter((column) => column.mobileInline);
  const hasToolbar = Boolean(searchText || filters || actions);
  const noRows = !loading && rows.length === 0;
  const noMatches = !loading && rows.length > 0 && sorted.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {hasToolbar ? (
        <div className="flex flex-wrap items-center gap-3">
          {searchText ? (
            <div className="relative min-w-0 flex-1 basis-56 sm:max-w-sm">
              <label htmlFor={searchId} className="sr-only">
                {t("search")}
              </label>
              <span
                aria-hidden="true"
                className="text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center"
              >
                <SearchOutlined />
              </span>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={t("search")}
                className="border-border bg-surface text-text placeholder:text-muted focus-visible:outline-accent h-10 w-full rounded-lg border pr-3 pl-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-1"
              />
            </div>
          ) : null}
          {filters}
          {actions ? (
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {loading ? "" : t("resultsCount", { count: sorted.length })}
      </p>

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <div
          role="region"
          aria-label={caption}
          // `relative`: ichidagi sr-only elementlar sahifaning gorizontal scroll'ini kengaytirmasin.
          // Gorizontal scroll bo'lganda klaviatura bilan ham aylantirish mumkin.
          tabIndex={0}
          className="focus-visible:outline-accent relative overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <table
            className="w-full border-collapse text-sm"
            aria-busy={loading || undefined}
          >
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="bg-surface-2">
                {columns.map((column) => {
                  const ariaSort =
                    sort?.id === column.id
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : column.sortValue
                        ? "none"
                        : undefined;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      aria-sort={ariaSort}
                      className={`text-muted px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap uppercase ${columnVisibility(
                        column,
                      )}`}
                    >
                      {column.hiddenHeader ? (
                        <span className="sr-only">{column.header}</span>
                      ) : column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.id)}
                          className="hover:text-text focus-visible:outline-accent -mx-1 inline-flex min-h-7 items-center gap-1.5 rounded px-1 uppercase focus-visible:outline-2"
                        >
                          {column.header}
                          <span
                            aria-hidden="true"
                            className="flex flex-col text-[8px] leading-[6px]"
                          >
                            <CaretUpFilled
                              className={
                                sort?.id === column.id && sort.dir === "asc"
                                  ? "text-accent-text"
                                  : "opacity-40"
                              }
                            />
                            <CaretDownFilled
                              className={
                                sort?.id === column.id && sort.dir === "desc"
                                  ? "text-accent-text"
                                  : "opacity-40"
                              }
                            />
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="border-border border-t">
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={`px-4 py-4 ${columnVisibility(column)}`}
                        >
                          <div className="bg-surface-2 h-4 w-3/4 animate-pulse rounded motion-reduce:animate-none" />
                        </td>
                      ))}
                    </tr>
                  ))
                : visible.map((row) => (
                    <tr
                      key={getRowId(row)}
                      className="border-border hover:bg-surface-2/60 border-t"
                    >
                      {columns.map((column, index) => (
                        <td
                          key={column.id}
                          className={`px-4 py-3 align-middle ${columnVisibility(
                            column,
                          )} ${column.className ?? ""}`}
                        >
                          {column.cell(row)}
                          {index === 0 && inlineColumns.length > 0 ? (
                            <div className="mt-2 flex flex-col items-start gap-2 md:hidden [&>div>div]:justify-start">
                              {inlineColumns.map((inline) => (
                                <div key={inline.id}>{inline.cell(row)}</div>
                              ))}
                            </div>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {noRows ? <EmptyState {...empty} /> : null}
        {noMatches ? (
          <EmptyState
            title={t("noResults")}
            text={t("noResultsText")}
            action={
              query ? (
                <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                  {t("clear")}
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {!loading && sorted.length > 0 ? (
          <div className="border-border text-muted flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <label htmlFor={`${searchId}-size`}>{t("perPage")}</label>
              <select
                id={`${searchId}-size`}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="border-border bg-surface text-text focus-visible:outline-accent h-9 rounded-lg border px-2 focus-visible:outline-2"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span aria-live="polite">
                {t("range", {
                  from: start + 1,
                  to: Math.min(start + pageSize, sorted.length),
                  total: sorted.length,
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 px-0"
                aria-label={t("prev")}
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
              >
                <LeftOutlined aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 px-0"
                aria-label={t("next")}
                disabled={current >= pageCount}
                onClick={() => setPage(current + 1)}
              >
                <RightOutlined aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Sahifa yuklanayotganda (loading.tsx) ko'rsatiladigan jadval skeleti. */
export function TableSkeleton({ rows = 5, label }: { rows?: number; label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="border-border bg-surface flex flex-col gap-0 overflow-hidden rounded-xl border"
    >
      <div className="bg-surface-2 h-11" />
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="border-border flex items-center gap-4 border-t px-4 py-4"
        >
          <div className="bg-surface-2 h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
          <div className="bg-surface-2 h-4 w-1/5 animate-pulse rounded motion-reduce:animate-none" />
          <div className="bg-surface-2 hidden h-4 w-1/6 animate-pulse rounded motion-reduce:animate-none sm:block" />
        </div>
      ))}
    </div>
  );
}
