"use client";

import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | "ellipsis")[] {
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => totalPages - rightCount + i + 1
    );
    return [1, "ellipsis", ...rightRange];
  }

  return [
    1,
    "ellipsis",
    ...Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    ),
    "ellipsis",
    totalPages,
  ];
}

function PaginationButton({
  children,
  active,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center min-w-[2rem] h-8 px-2 text-sm rounded-lg transition-all duration-[150ms] cubic-bezier(0.16,1,0.3,1)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sh-green-800)]",
        active
          ? "bg-gradient-to-br from-[var(--sh-green-800)] to-[var(--sh-green-600)] text-white font-semibold shadow-sm"
          : "text-[var(--text)] hover:bg-[var(--surface-2)]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => generatePagination(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
    >
      <PaginationButton
        disabled={currentPage <= 1}
        onClick={() => onPageChange(1)}
        ariaLabel="First page"
      >
        <ChevronsLeft size={16} />
      </PaginationButton>
      <PaginationButton
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        ariaLabel="Previous page"
      >
        <ChevronLeft size={16} />
      </PaginationButton>

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center w-8 h-8 text-sm text-[var(--text-muted)]"
          >
            ...
          </span>
        ) : (
          <PaginationButton
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
            ariaLabel={`Page ${page}`}
          >
            {page}
          </PaginationButton>
        )
      )}

      <PaginationButton
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        ariaLabel="Next page"
      >
        <ChevronRight size={16} />
      </PaginationButton>
      <PaginationButton
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        ariaLabel="Last page"
      >
        <ChevronsRight size={16} />
      </PaginationButton>
    </nav>
  );
}

interface PerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
}

function PerPageSelect({
  value,
  onChange,
  options = [10, 25, 50, 100],
  className,
}: PerPageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]",
        "focus:outline-none focus:border-[var(--sh-green-800)] focus:shadow-[0_0_0_3px_rgba(11,110,79,0.15)]",
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt} / page
        </option>
      ))}
    </select>
  );
}

export { Pagination, PerPageSelect };
