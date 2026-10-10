"use client";

import { useState, useMemo, ReactNode } from "react";
import { ChevronUp, ChevronDown, Search, Download, Inbox } from "lucide-react";
import { Skeleton } from "./skeleton";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  pageSize?: number;
  filterPlaceholder?: string;
  exportFileName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  onRowClick,
  pageSize = 25,
  filterPlaceholder = "Search...",
  exportFileName = "export",
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display.",
}: DataTableProps<T>) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filter.trim()) return data;
    const lower = filter.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, filter, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === "asc" ? -1 : 1;
      if (bVal == null) return sortDir === "asc" ? 1 : -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Reset page when filter changes
  const handleFilterChange = (val: string) => {
    setFilter(val);
    setCurrentPage(1);
  };

  // Handle sort toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // CSV export
  const handleExport = () => {
    const headers = columns.map((c) => c.header);
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const val = row[col.key];
        return val != null ? String(val) : "";
      })
    );
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Skeleton rows
  if (loading) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem" }}>
          <Skeleton style={{ height: "2.5rem", width: "240px", borderRadius: "0.75rem" }} />
        </div>
        <div
          style={{
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--border, #e8efe9)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            aria-busy="true"
            aria-label="Loading data"
          >
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted, #6b7c72)",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--border, #e8efe9)",
                      whiteSpace: "nowrap",
                      width: col.width,
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(5, pageSize) }).map((_, r) => (
                <tr key={`skel-${r}`}>
                  {columns.map((col) => (
                    <td
                      key={`skel-${r}-${col.key}`}
                      style={{
                        padding: "0.875rem 1rem",
                        borderBottom: "1px solid var(--border, #e8efe9)",
                      }}
                    >
                      <Skeleton style={{ height: "1rem", width: `${60 + Math.random() * 30}%`, borderRadius: "4px" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 1.5rem",
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--border, #e8efe9)",
            borderRadius: "1rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(11, 110, 79, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              color: "var(--brand)",
            }}
          >
            <Inbox size={32} />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--heading-color, #111612)",
              marginBottom: "0.25rem",
            }}
          >
            {emptyTitle}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted, #6b7c72)",
              textAlign: "center",
              maxWidth: "280px",
            }}
          >
            {emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Toolbar: filter + export */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "320px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted, #6b7c72)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={filterPlaceholder}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              fontSize: "0.875rem",
              border: "1.5px solid var(--border, #e8efe9)",
              borderRadius: "0.75rem",
              background: "var(--surface, #ffffff)",
              color: "var(--text, #111612)",
              outline: "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              minHeight: "2.5rem",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11, 110, 79, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border, #e8efe9)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--text-muted, #6b7c72)",
            background: "var(--surface, #ffffff)",
            border: "1.5px solid var(--border, #e8efe9)",
            borderRadius: "0.75rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
            minHeight: "2.5rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand)";
            e.currentTarget.style.color = "var(--brand)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border, #e8efe9)";
            e.currentTarget.style.color = "var(--text-muted, #6b7c72)";
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Result count */}
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-muted, #6b7c72)",
          marginBottom: "0.75rem",
        }}
      >
        Showing {paginatedData.length} of {sortedData.length} records
      </p>

      {/* Table with mobile scroll */}
      <div
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #e8efe9)",
          borderRadius: "1rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}
            aria-label="Data table"
          >
            <thead>
              <tr>
                {columns.map((col) => {
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      style={{
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: isActive ? "var(--brand)" : "var(--text-muted, #6b7c72)",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--border, #e8efe9)",
                        whiteSpace: "nowrap",
                        width: col.width,
                        cursor: col.sortable ? "pointer" : "default",
                        userSelect: "none",
                        transition: "color 0.15s ease",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {col.header}
                        {col.sortable && (
                          <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 0 }}>
                            <ChevronUp
                              size={12}
                              style={{
                                color: isActive && sortDir === "asc" ? "var(--brand)" : "var(--text-muted, #6b7c72)",
                                opacity: isActive && sortDir === "asc" ? 1 : 0.4,
                                marginBottom: "-2px",
                              }}
                            />
                            <ChevronDown
                              size={12}
                              style={{
                                color: isActive && sortDir === "desc" ? "var(--brand)" : "var(--text-muted, #6b7c72)",
                                opacity: isActive && sortDir === "desc" ? 1 : 0.4,
                                marginTop: "-2px",
                              }}
                            />
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={(row as Record<string, unknown>).id as string ?? idx}
                  onClick={onRowClick ? () => onRowClick(row, (safeCurrentPage - 1) * pageSize + idx) : undefined}
                  style={{
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(11, 110, 79, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "0.875rem 1rem",
                        fontSize: "0.9375rem",
                        color: "var(--text, #111612)",
                        borderBottom: "1px solid var(--border, #e8efe9)",
                        verticalAlign: "middle",
                      }}
                    >
                      {col.render
                        ? col.render(row, (safeCurrentPage - 1) * pageSize + idx)
                        : (row[col.key] as ReactNode) ?? " "}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted, #6b7c72)",
            }}
          >
            Page {safeCurrentPage} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <PaginationButton
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </PaginationButton>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              // Show first, last, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - safeCurrentPage) <= 1
              ) {
                return (
                  <PaginationButton
                    key={page}
                    active={page === safeCurrentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationButton>
                );
              }
              if (
                Math.abs(page - safeCurrentPage) === 2 &&
                page !== 1 &&
                page !== totalPages
              ) {
                return (
                  <span
                    key={`ellipsis-${page}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted, #6b7c72)",
                    }}
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
            <PaginationButton
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Pagination Button ────────────────────────── */

function PaginationButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "2rem",
        height: "2rem",
        padding: "0 0.5rem",
        fontSize: "0.8125rem",
        fontWeight: active ? 600 : 400,
        color: active ? "#ffffff" : disabled ? "var(--text-muted, #6b7c72)" : "var(--text, #111612)",
        background: active
          ? "linear-gradient(135deg, var(--brand) 0%, #12926a 100%)"
          : "transparent",
        border: active ? "none" : "1px solid var(--border, #e8efe9)",
        borderRadius: "0.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}
