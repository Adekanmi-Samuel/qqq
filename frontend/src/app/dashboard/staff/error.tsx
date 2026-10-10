"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function StaffError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Something went wrong</h2>
        <p className="text-[var(--text-muted)] mb-4">{error.message}</p>
        <button onClick={reset} className="flex items-center gap-2 mx-auto px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg hover:opacity-90">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
