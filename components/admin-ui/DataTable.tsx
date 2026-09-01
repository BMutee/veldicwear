"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Input } from "./primitives";

/* Veldic Admin — DataTable: generic client table with search,
   sort (via sortValue), pagination and mobile column hiding. */

export type Column<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  /** Provide to make this column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  /** Hide on <md screens (e.g. secondary metadata columns). */
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** String used when the search box filters rows. Omit to disable search. */
  searchValue?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyState?: ReactNode;
  /** Rendered between search box and table (e.g. "New" button). */
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchValue,
  searchPlaceholder = "Search…",
  pageSize = 10,
  emptyState,
  toolbar,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;
    if (searchValue && query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => searchValue(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
      }
    }
    return out;
  }, [rows, query, sort, columns, searchValue]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" }
    );
  };

  return (
    <div>
      {(searchValue || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {searchValue ? (
            <div className="w-full max-w-xs">
              <Input
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                ariaLabel="Search table"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone/20 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone/20 bg-bone/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone ${col.headerClassName ?? ""} ${
                    col.hideOnMobile ? "hidden md:table-cell" : ""
                  }`}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors duration-150 hover:text-ink"
                    >
                      {col.header}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className={`h-3 w-3 transition-transform duration-150 ${
                          sort?.key === col.key ? (sort.dir === "asc" ? "" : "rotate-180") : "opacity-30"
                        }`}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-stone/15 last:border-0 transition-colors duration-150 hover:bg-bone/70 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 align-middle ${col.className ?? ""} ${
                      col.hideOnMobile ? "hidden md:table-cell" : ""
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-stone">
                  {emptyState ?? "Nothing here yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <nav
        aria-label="Table pagination"
        className="mt-4 flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-xs text-stone">
          {filtered.length === 0
            ? "No results"
            : `Showing ${safePage * pageSize + 1}–${Math.min(filtered.length, (safePage + 1) * pageSize)} of ${filtered.length}`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="cursor-pointer rounded-lg border border-stone/30 bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-bone disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-current={i === safePage ? "page" : undefined}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  i === safePage
                    ? "bg-ink text-bone"
                    : "border border-stone/30 bg-white text-ink hover:bg-bone"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="cursor-pointer rounded-lg border border-stone/30 bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-bone disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </nav>

    </div>
  );
}
