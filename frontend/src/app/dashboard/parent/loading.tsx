export default function ParentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--surface-2)] rounded w-48" />
      <div className="h-4 bg-[var(--surface-2)] rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[var(--surface-2)] rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--surface-2)] rounded w-24 mb-1" />
                <div className="h-3 bg-[var(--surface-2)] rounded w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
              <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
