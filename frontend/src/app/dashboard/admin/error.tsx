"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Admin dashboard error"
      message="Something went wrong loading the admin dashboard. Please try again."
    />
  );
}
