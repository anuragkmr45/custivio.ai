import { type ReactNode, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  searchValue?: (row: T) => string;
};

export type TablePageInfo = {
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
};

export function DataTable<T>({
  rows,
  columns,
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  initialSort,
  toolbar,
  empty,
  pagination,
  onPageChange,
  rowKey,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  toolbar?: ReactNode;
  empty?: ReactNode;
  pagination?: TablePageInfo;
  onPageChange?: (offset: number) => void;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const activeSearchValue = onSearchChange ? (searchValue ?? "") : q;

  const filtered = useMemo(() => {
    if (onSearchChange) return rows;

    const needle = activeSearchValue.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      columns.some((c) => {
        const v =
          c.searchValue?.(r) ?? (typeof c.cell(r) === "string" ? (c.cell(r) as string) : "");
        return String(v).toLowerCase().includes(needle);
      }),
    );
  }, [activeSearchValue, onSearchChange, rows, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sort, columns]);

  return (
    <div className="rounded-md border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={activeSearchValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            onChange={(e) =>
              onSearchChange ? onSearchChange(e.target.value) : setQ(e.target.value)
            }
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-sm"
          />
        </div>
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left font-medium",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className,
                  )}
                >
                  {c.sortable && c.sortValue ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSort((prev) =>
                          prev?.key === c.key
                            ? { key: c.key, dir: prev.dir === "asc" ? "desc" : "asc" }
                            : { key: c.key, dir: "asc" },
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {empty ?? "No records match the current filters."}
                </td>
              </tr>
            )}
            {sorted.map((row, i) => (
              <tr
                key={rowKey?.(row) ?? String((row as { id?: string | number }).id ?? i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60 last:border-b-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-surface-2",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2 align-middle text-foreground",
                      c.align === "right" && "text-right tabular-nums",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span>{formatRecordCount(sorted.length, rows.length, pagination)}</span>
        {pagination ? (
          <div className="flex items-center gap-2">
            <span>{formatPageLabel(pagination)}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7"
                disabled={pagination.offset <= 0 || pagination.isLoading}
                onClick={() => onPageChange?.(Math.max(0, pagination.offset - pagination.limit))}
                title="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7"
                disabled={
                  pagination.offset + pagination.limit >= pagination.total || pagination.isLoading
                }
                onClick={() => onPageChange?.(pagination.offset + pagination.limit)}
                title="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <span>Page 1 of 1</span>
        )}
      </div>
    </div>
  );
}

function formatRecordCount(currentRows: number, originalRows: number, pagination?: TablePageInfo) {
  if (!pagination) {
    return `${currentRows} of ${originalRows} records`;
  }

  if (pagination.total === 0) {
    return "0 records";
  }

  const first = pagination.offset + 1;
  const last = Math.min(pagination.offset + currentRows, pagination.total);
  return `${first}-${last} of ${pagination.total} records`;
}

function formatPageLabel(pagination: TablePageInfo) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const currentPage = Math.min(totalPages, Math.floor(pagination.offset / pagination.limit) + 1);
  return `Page ${currentPage} of ${totalPages}`;
}
