"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function TeacherError({
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
      title="Teacher dashboard error"
      message="Something went wrong loading your dashboard. Please try again."
    />
  );
}
