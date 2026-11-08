"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { number, type DataRow } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./dashboard-ui";
import { cn } from "@/lib/utils";

export type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  header?: ReactNode;
  cellStyle?: (value: DataRow[string], row: DataRow) => CSSProperties | undefined;
  render?: (value: DataRow[string], row: DataRow) => ReactNode;
};

export function DataTable({
  rows,
  columns,
  pageSize = 6,
  searchPlaceholder = "Cari data…",
  defaultSort,
  searchable = true,
  pagination = true,
  resetOnEmpty = true,
  highlightRow = (row) => row.Channel === "INEWS",
}: {
  rows: DataRow[];
  columns: Column[];
  pageSize?: number;
  searchPlaceholder?: string;
  defaultSort?: string;
  searchable?: boolean;
  pagination?: boolean;
  resetOnEmpty?: boolean;
  highlightRow?: (row: DataRow) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({
    key: defaultSort ?? "",
    descending: true,
  });
  const filtered = rows.filter((row) =>
    columns.some((column) =>
      String(row[column.key] ?? "")
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
    ),
  );
  const sorted = sort.key
    ? [...filtered].sort((a, b) => {
        const left = a[sort.key],
          right = b[sort.key];
        const comparison =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left ?? "").localeCompare(String(right ?? ""), "id", {
                numeric: true,
              });
        return sort.descending ? -comparison : comparison;
      })
    : filtered;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  return (
    <div className="min-w-0">
      {searchable && (
        <div className="builder-table-search">
          <MagnifyingGlassIcon size={16} aria-hidden="true" />
          <input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
          <span className="ml-auto text-3xs whitespace-nowrap">
            {number(filtered.length)} data
          </span>
        </div>
      )}
      {sorted.length ? (
        <>
          <div
            className="builder-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabel data, gulir untuk kolom lainnya"
          >
            <table className="builder-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        column.numeric && "is-numeric",
                      )}
                      aria-sort={
                        sort.key === column.key
                          ? sort.descending
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      <Button
                        variant="ghost"
                        className="h-auto min-h-10 gap-1.5 px-0 text-inherit"
                        onClick={() => {
                          setSort({
                            key: column.key,
                            descending:
                              sort.key === column.key
                                ? !sort.descending
                                : !!column.numeric,
                          });
                          setPage(0);
                        }}
                      >
                        {column.header ?? column.label}
                        {sort.key === column.key ? (
                          sort.descending ? (
                            <CaretDownIcon size={11} aria-hidden="true" />
                          ) : (
                            <CaretUpIcon size={11} aria-hidden="true" />
                          )
                        ) : (
                          <span className="text-2xs opacity-50" aria-hidden="true">↕</span>
                        )}
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted
                  .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                  .map((row, index) => (
                    <tr
                      key={`${currentPage}-${index}`}
                      className={highlightRow(row) ? "is-highlighted" : undefined}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          style={column.cellStyle?.(row[column.key], row)}
                          className={cn(
                            column.numeric && "is-numeric",
                          )}
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : (row[column.key] ?? "–")}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {pagination && <div className="builder-table-pagination">
            <span className="text-4xs sm:text-3xs">
              {currentPage * pageSize + 1}–
              {Math.min((currentPage + 1) * pageSize, sorted.length)} dari{" "}
              {number(sorted.length)} data
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Halaman sebelumnya"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <CaretLeftIcon size={15} aria-hidden="true" />
              </Button>
              <span>
                {currentPage + 1} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Halaman berikutnya"
                disabled={currentPage === pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <CaretRightIcon size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>}
        </>
      ) : (
        <EmptyState
          text={
            query
              ? `Tidak ada hasil untuk “${query}”. Coba kata lain.`
              : undefined
          }
          reset={resetOnEmpty && !query}
        />
      )}
    </div>
  );
}
