"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-[var(--surface-2)] via-[var(--border)] to-[var(--surface-2)] bg-[length:400px_100%]",
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 rounded"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-4",
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      <div className="flex items-center gap-4">
        <SkeletonCircle size={48} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-4 py-3", className)}
      role="status"
      aria-label="Loading row"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 rounded flex-1"
          style={{ maxWidth: i === 0 ? "25%" : undefined }}
        />
      ))}
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-0", className)}
      role="status"
      aria-label="Loading table"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

/** Page-level loading skeleton with title, cards, and table */
function PageSkeleton({ title = "Loading..." }: { title?: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}

/** Form loading skeleton */
function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-32 rounded-xl mt-6" />
    </div>
  );
}

/** List loading skeleton */
function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 flex items-center gap-4">
          <SkeletonCircle size={40} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Chart loading skeleton */
function SkeletonChart() {
  const heights = [45, 72, 58, 85, 40, 65, 78, 52];
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 space-y-4" role="status" aria-label="Loading chart">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-end gap-2 h-48">
        {heights.map((h, i) => (
          <div key={i} className="flex-1" style={{ height: `${h}%` }}>
            <Skeleton className="h-full w-full rounded-t" />
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  PageSkeleton,
  SkeletonForm,
  SkeletonList,
  SkeletonChart,
};
