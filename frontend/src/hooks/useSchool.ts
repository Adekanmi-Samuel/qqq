"use client";

import { useCallback } from "react";
import { useApi } from "./useApi";

export function useSchool() {
  const { get, patch, post, loading, error } = useApi();

  const getProfile = useCallback(async (slug: string) => {
    return get<{ success: boolean; data: any }>(`/api/schools/${slug}`);
  }, [get]);

  const updateSchool = useCallback(async (id: string, data: any) => {
    return patch<{ success: boolean; data: any }>(`/api/schools/${id}`, data);
  }, [patch]);

  const verifySchool = useCallback(async (schoolId: string) => {
    return post<{ success: boolean; data: any }>("/api/schools/verify", { schoolId });
  }, [post]);

  return { getProfile, updateSchool, verifySchool, loading, error };
}
