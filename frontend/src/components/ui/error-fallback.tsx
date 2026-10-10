import Link from "next/link";

interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-display font-semibold text-theme-heading mb-2">{title}</h2>
      <p className="text-sm text-theme-muted text-center max-w-md mb-6">{message}</p>
      {error && process.env.NODE_ENV === "development" && (
        <pre className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-lg overflow-auto">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        {reset && (
          <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
            Try again
          </button>
        )}
        <Link href="/dashboard" className="btn-secondary px-6 py-2.5 text-sm">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export function NotFoundFallback({ resource = "Page" }: { resource?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-display font-semibold text-theme-heading mb-2">{resource} not found</h2>
      <p className="text-sm text-theme-muted text-center max-w-md mb-6">
        The {resource.toLowerCase()} you're looking for doesn't exist or has been removed.
      </p>
      <Link href="/dashboard" className="btn-primary px-6 py-2.5 text-sm">
        Go to dashboard
      </Link>
    </div>
  );
}

export function OfflineFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 bg-[var(--surface-2)] rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
        </svg>
      </div>
      <h2 className="text-xl font-display font-semibold text-theme-heading mb-2">No internet connection</h2>
      <p className="text-sm text-theme-muted text-center max-w-md mb-6">
        Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary px-6 py-2.5 text-sm"
      >
        Retry
      </button>
    </div>
  );
}
