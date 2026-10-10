"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,       // 30s   don't refetch immediately on mount
            retry: 1,                 // Retry once on failure
            refetchOnWindowFocus: false,  // Don't refetch on tab focus
            refetchOnMount: true,
          },
          mutations: {
            retry: 0,                 // Don't retry mutations
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
