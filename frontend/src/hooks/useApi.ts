"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

/**
 * API hook using the shared cookie-auth client.
 * Returns get/post/patch/del helpers plus loading/error state.
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      const message = e?.message || "Network error. Check your connection.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    <T = unknown>(path: string, options?: Parameters<typeof api.get>[1]) =>
      run(() => api.get<T>(path, options)),
    [run]
  );

  const post = useCallback(
    <T = unknown>(path: string, body?: unknown, options?: Parameters<typeof api.post>[2]) =>
      run(() => api.post<T>(path, body, options)),
    [run]
  );

  const patch = useCallback(
    <T = unknown>(path: string, body?: unknown, options?: Parameters<typeof api.patch>[2]) =>
      run(() => api.patch<T>(path, body, options)),
    [run]
  );

  const del = useCallback(
    <T = unknown>(path: string, options?: Parameters<typeof api.delete>[1]) =>
      run(() => api.delete<T>(path, options)),
    [run]
  );

  return { get, post, patch, del, loading, error, setError };
}
