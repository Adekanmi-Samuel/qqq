export default function StaffLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--surface-2)] rounded w-48" />
      <div className="h-4 bg-[var(--surface-2)] rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="h-10 bg-[var(--surface-2)] rounded w-10 mb-3" />
            <div className="h-4 bg-[var(--surface-2)] rounded w-24 mb-1" />
            <div className="h-6 bg-[var(--surface-2)] rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
