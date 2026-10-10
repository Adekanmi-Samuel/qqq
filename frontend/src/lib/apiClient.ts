"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { API_URL } from "@/lib/config";

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = { success: true; data: T; message?: string } | ApiError;

/**
 * Get CSRF token from cookie for mutating requests
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const csrfCookie = cookies.find(c => c.trim().startsWith("sh_csrf="));
  return csrfCookie ? csrfCookie.split("=")[1].trim() : null;
}

/**
 * Check if a request is a mutating operation (POST, PUT, PATCH, DELETE)
 */
function isMutatingRequest(method?: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase());
}

/**
 * Centralized API client with cookie-based auth and CSRF protection.
 * Use this hook in components to make typed API calls.
 */
export function useApiClient() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const request = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    // Add CSRF token for mutating requests (double-submit pattern)
    if (isMutatingRequest(options.method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }

    // With cookie-based auth, we use credentials: "include" to send HttpOnly cookies
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Important: send cookies with cross-origin requests
    });

    if (res.status === 401) {
      // Session expired   logout and redirect
      await logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please sign in again.");
    }

    // Handle 403 CSRF errors specifically
    if (res.status === 403) {
      const data = await res.json().catch(() => ({ success: false, error: {} }));
      if (data.error?.code === "CSRF_INVALID") {
        throw new Error("Security token mismatch. Please refresh the page.");
      }
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error((json as ApiError).error || "An error occurred.");
    }

    return (json as { success: true; data: T }).data;
  }, [logout]);

  /**
   * GET request with TanStack Query integration.
   */
  const get = useCallback(<T>(
    endpoint: string,
    options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
  ) => {
    return useQuery<T, Error>({
      queryKey: [endpoint],
      queryFn: () => request<T>(endpoint),
      ...options,
    });
  }, [request]);

  /**
   * POST request with TanStack Query mutation.
   */
  const post = useCallback(<TData = unknown, TVariables = unknown>(
    endpoint: string,
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn: (variables) =>
        request<TData>(endpoint, {
          method: "POST",
          body: JSON.stringify(variables),
        }),
      ...options,
    });
  }, [request]);

  /**
   * PUT request with TanStack Query mutation.
   */
  const put = useCallback(<TData = unknown, TVariables = unknown>(
    endpoint: string,
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn: (variables) =>
        request<TData>(endpoint, {
          method: "PUT",
          body: JSON.stringify(variables),
        }),
      ...options,
    });
  }, [request]);

  /**
   * PATCH request with TanStack Query mutation.
   */
  const patch = useCallback(<TData = unknown, TVariables = unknown>(
    endpoint: string,
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn: (variables) =>
        request<TData>(endpoint, {
          method: "PATCH",
          body: JSON.stringify(variables),
        }),
      ...options,
    });
  }, [request]);

  /**
   * DELETE request with TanStack Query mutation.
   */
  const del = useCallback(<TData = unknown>(
    endpoint: string,
    options?: Omit<UseMutationOptions<TData, Error, void>, "mutationFn">
  ) => {
    return useMutation<TData, Error, void>({
      mutationFn: () => request<TData>(endpoint, { method: "DELETE" }),
      ...options,
    });
  }, [request]);

  /**
   * Invalidate a set of query keys to trigger refetch.
   */
  const invalidate = useCallback((queryKey: string[]) => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  return { get, post, put, patch, del, request, invalidate, queryClient };
}